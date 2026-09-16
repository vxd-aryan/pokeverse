from fastapi import FastAPI, HTTPException, status, Header, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Set, Any
import datetime
import requests
import random
import os
import json
import time
import uuid
import asyncio
import math

# Corrected absolute imports using 'app.' prefix
from app.database import get_db, engine
from app import models
from app import schemas
from app import crud

# Automatically generate database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PokéVerse Academy Sync Matrix")

# Dynamically read allowed frontend origins from environment variables.
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://pokeverse-seven.vercel.app")
origins = [origin.strip() for origin in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DAILY GAUNTLET STATE CACHE ---
DAILY_CACHE = {
    "date": None,
    "questions": []
}

def generate_daily_gauntlet():
    """Generates 10 mixed questions using today's date as a seed."""
    today_str = datetime.date.today().isoformat()

    if DAILY_CACHE["date"] == today_str and DAILY_CACHE["questions"]:
        return DAILY_CACHE["questions"]

    seed_val = int(today_str.replace("-", ""))
    rng = random.Random(seed_val)

    questions = []

    for i in range(10):
        poke_id = rng.randint(1, 1025)
        try:
            res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{poke_id}").json()
            name = res["name"].replace("-", " ").title()
            artwork = res["sprites"]["other"]["official-artwork"]["front_default"] or res["sprites"]["front_default"]

            if i % 3 == 0:
                types = [t["type"]["name"].capitalize() for t in res["types"]]
                correct = " / ".join(types)
                q_text = f"What is the exact typing of {name}?"
                options = [correct]
                while len(options) < 4:
                    wrong = rng.choice(["Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"])
                    if wrong not in options: options.append(wrong)
            else:
                q_text = "Identify this Pokémon."
                correct = name
                options = [correct]
                while len(options) < 4:
                    wrong_id = rng.randint(1, 1025)
                    wrong_name = requests.get(f"https://pokeapi.co/api/v2/pokemon/{wrong_id}").json()["name"].replace("-", " ").title()
                    if wrong_name not in options: options.append(wrong_name)

            rng.shuffle(options)
            questions.append({
                "id": i,
                "question_text": q_text,
                "artwork_url": artwork,
                "options": options,
                "correct_answer": correct,
                "is_silhouette": (i % 2 == 0)
            })
        except Exception:
            continue

    DAILY_CACHE["date"] = today_str
    DAILY_CACHE["questions"] = questions
    return questions


# --- AUTHENTICATION ROUTES ---

@app.post("/api/auth/register")
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered in the Pokédex.")

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=user_data.password,
        level=1,
        title="Novice Trainer",
        current_xp=0,
        daily_correct=0,
        avg_response_time_sec=10.0,
        daily_streak=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration successful", "email": new_user.email, "username": new_user.username}

@app.post("/api/auth/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.hashed_password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"message": "Login successful", "email": user.email, "username": user.username}


# --- PROFILE ROUTES ---

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session.")

    user_email = authorization.split(" ")[1]
    user = db.query(models.User).filter(models.User.email == user_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Trainer profile not found.")

    return user

@app.delete("/api/users/me")
def delete_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session.")

    user_email = authorization.split(" ")[1]
    user = db.query(models.User).filter(models.User.email == user_email).first()

    if user:
        db.delete(user)
        db.commit()
        return {"message": "Trainer profile completely erased from Academy records."}

    raise HTTPException(status_code=404, detail="Trainer profile not found.")


# --- COMPETITIVE ROUTES ---

@app.get("/api/users/leaderboard", response_model=List[schemas.LeaderboardUserResponse])
def get_global_leaderboard(db: Session = Depends(get_db)):
    top_trainers = db.query(models.User).order_by(
        models.User.level.desc(),
        models.User.current_xp.desc()
    ).limit(50).all()
    return top_trainers

@app.get("/api/leaderboard/daily", response_model=List[schemas.LeaderboardUserResponse])
def get_daily_leaderboard(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session.")
    return crud.get_daily_leaderboard(db)

@app.get("/api/quiz/daily/questions")
def get_daily_questions():
    return generate_daily_gauntlet()

@app.post("/api/quiz/daily/submit", response_model=schemas.UserResponse)
def submit_daily_gauntlet(
    payload: schemas.DailyQuizSubmission,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session.")

    user_email = authorization.split(" ")[1]
    user = db.query(models.User).filter(models.User.email == user_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Trainer not found in the Academy database.")

    today = datetime.date.today()
    today_str = str(today)
    yesterday_str = str(today - datetime.timedelta(days=1))

    user_last_date_str = str(user.last_quiz_date) if user.last_quiz_date else None

    if user_last_date_str == today_str:
        raise HTTPException(
            status_code=400,
            detail="Daily Gauntlet evaluation already recorded for today. Come back tomorrow!"
        )

    score = getattr(payload, 'daily_correct', getattr(payload, 'score', 0))
    if score > 10:
        raise HTTPException(
            status_code=400,
            detail="Matrix mismatch: Submitted score exceeds maximum gauntlet parameters."
        )

    if user_last_date_str == yesterday_str:
        user.daily_streak += 1
    else:
        user.daily_streak = 1

    user.last_quiz_date = today
    user.daily_correct += score

    xp_gained = score * 50
    user.current_xp += xp_gained

    while user.current_xp >= (user.level * 100):
        user.current_xp -= (user.level * 100)
        user.level += 1
        if hasattr(crud, 'determine_title'):
            user.title = crud.determine_title(user.level)

    db.commit()
    db.refresh(user)

    return user

# --- PRACTICE MODULE ROUTES ---

@app.get("/api/quiz/whos-that", response_model=schemas.QuizQuestion)
def get_whos_that_question():
    pokemon_id = random.randint(1, 1025)
    res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}").json()

    correct_name = res["name"].capitalize()
    artwork_url = res["sprites"]["other"]["official-artwork"]["front_default"] or res["sprites"]["front_default"]

    options = [correct_name]
    while len(options) < 4:
        wrong_id = random.randint(1, 1025)
        if wrong_id != pokemon_id:
            try:
                wrong_res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{wrong_id}").json()
                wrong_name = wrong_res["name"].capitalize()
                if wrong_name not in options:
                    options.append(wrong_name)
            except Exception:
                continue

    random.shuffle(options)

    return {
        "pokemon_id": pokemon_id,
        "artwork_url": artwork_url or "",
        "options": options
    }

@app.get("/api/quiz/type-match")
def get_type_match_question():
    ALL_TYPES = [
        "normal", "fire", "water", "grass", "electric", "ice", "fighting",
        "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
        "dragon", "dark", "steel", "fairy"
    ]

    pokemon_id = random.randint(1, 1025)
    try:
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}").json()
    except Exception:
        pokemon_id = 25
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}").json()

    pokemon_name = res["name"].replace("-", " ").title()
    artwork_url = res["sprites"]["other"]["official-artwork"]["front_default"] or res["sprites"]["front_default"]

    types = [t["type"]["name"] for t in res["types"]]
    multipliers = {t: 1.0 for t in ALL_TYPES}

    for t in types:
        t_data = requests.get(f"https://pokeapi.co/api/v2/type/{t}").json()["damage_relations"]
        for rel in t_data["double_damage_from"]: multipliers[rel["name"]] *= 2.0
        for rel in t_data["half_damage_from"]: multipliers[rel["name"]] *= 0.5
        for rel in t_data["no_damage_from"]: multipliers[rel["name"]] *= 0.0

    quad_weak = [k for k, v in multipliers.items() if v == 4.0]
    double_weak = [k for k, v in multipliers.items() if v == 2.0]
    resist = [k for k, v in multipliers.items() if v == 0.5]
    quad_resist = [k for k, v in multipliers.items() if v == 0.25]
    immune = [k for k, v in multipliers.items() if v == 0.0]

    q_pool = []

    if random.random() < 0.20:
        correct_answer = " / ".join(t.capitalize() for t in types)
        question_text = f"What is the exact typing of {pokemon_name}?"
        options = [correct_answer]
        while len(options) < 4:
            t1 = random.choice(ALL_TYPES).capitalize()
            t2 = random.choice(ALL_TYPES).capitalize()
            wrong = f"{t1} / {t2}" if random.random() < 0.5 and t1 != t2 else t1
            if wrong not in options:
                options.append(wrong)
        random.shuffle(options)
        return {
            "pokemon_id": pokemon_id, "artwork_url": artwork_url,
            "question_text": question_text, "options": options,
            "correct_answer": correct_answer, "pokemon_name": pokemon_name
        }

    if quad_weak: q_pool.append(("deals massive 4x damage to", quad_weak))
    if double_weak: q_pool.append(("deals 2x super-effective damage to", double_weak))
    if immune: q_pool.append(("has absolutely NO EFFECT (0x) on", immune))
    if quad_resist: q_pool.append(("is heavily resisted (0.25x) by", quad_resist))
    if resist: q_pool.append(("is resisted (0.5x) by", resist))

    if not q_pool:
        q_pool.append(("deals 2x super-effective damage to", double_weak))

    phrase, correct_pool = random.choice(q_pool)
    correct_type = random.choice(correct_pool).capitalize()
    question_text = f"Which of these types {phrase} {pokemon_name}?"

    options = [correct_type]
    while len(options) < 4:
        wrong_type = random.choice(ALL_TYPES).capitalize()
        if wrong_type.lower() not in correct_pool and wrong_type not in options:
            options.append(wrong_type)

    random.shuffle(options)

    return {
        "pokemon_id": pokemon_id,
        "artwork_url": artwork_url,
        "question_text": question_text,
        "options": options,
        "correct_answer": correct_type,
        "pokemon_name": pokemon_name
    }

@app.get("/api/quiz/region", response_model=schemas.QuizQuestion)
def get_region_question():
    pokemon_id = random.randint(1, 386)
    res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}").json()

    if pokemon_id <= 151:
        correct_region = "Kanto"
    elif pokemon_id <= 251:
        correct_region = "Johto"
    else:
        correct_region = "Hoenn"

    artwork_url = res["sprites"]["other"]["official-artwork"]["front_default"]
    all_regions = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos"]

    options = [correct_region]
    while len(options) < 4:
        wrong_region = random.choice(all_regions)
        if wrong_region not in options:
            options.append(wrong_region)

    random.shuffle(options)
    return {
        "pokemon_id": pokemon_id,
        "artwork_url": artwork_url,
        "options": options
    }

@app.get("/api/quiz/evolution", response_model=schemas.QuizQuestion)
def get_evolution_question():
    while True:
        try:
            chain_id = random.randint(1, 200)
            res = requests.get(f"https://pokeapi.co/api/v2/evolution-chain/{chain_id}").json()

            chain = res.get("chain", {})
            folds_to = chain.get("evolves_to", [])

            if not folds_to:
                continue

            base_name = chain["species"]["name"]
            evo_name = folds_to[0]["species"]["name"].capitalize()

            base_pokemon = requests.get(f"https://pokeapi.co/api/v2/pokemon/{base_name}").json()
            pokemon_id = base_pokemon["id"]
            artwork_url = base_pokemon["sprites"]["other"]["official-artwork"]["front_default"]

            options = [evo_name]
            while len(options) < 4:
                wrong_id = random.randint(1, 386)
                wrong_name = requests.get(f"https://pokeapi.co/api/v2/pokemon/{wrong_id}").json()["name"].capitalize()
                if wrong_name not in options and wrong_name != base_name.capitalize():
                    options.append(wrong_name)

            random.shuffle(options)
            return {
                "pokemon_id": pokemon_id,
                "artwork_url": artwork_url,
                "options": options
            }
        except Exception:
            continue

@app.post("/api/quiz/practice/submit", response_model=schemas.UserResponse)
def submit_practice_quiz(
    payload: schemas.QuizSubmit,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized session.")

    user_email = authorization.split(" ")[1]
    user = db.query(models.User).filter(models.User.email == user_email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Trainer not found.")

    if payload.is_correct:
        user.current_xp += 20

        while user.current_xp >= (user.level * 100):
            user.current_xp -= (user.level * 100)
            user.level += 1
            if hasattr(crud, 'determine_title'):
                user.title = crud.determine_title(user.level)

        db.commit()
        db.refresh(user)

    return user


# --- EXPANDED MULTIPLAYER BATTLE ARENA ENGINE ---

BATTLE_TYPES = [
    "Normal", "Fire", "Water", "Grass", "Electric", "Ice",
    "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
    "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
]

TYPE_CHART: Dict[str, Dict[str, float]] = {atk: {defn: 1.0 for defn in BATTLE_TYPES} for atk in BATTLE_TYPES}


def _set_type_eff(atk: str, defn: str, mult: float):
    TYPE_CHART[atk][defn] = mult


_set_type_eff("Normal", "Rock", 0.5); _set_type_eff("Normal", "Ghost", 0.0); _set_type_eff("Normal", "Steel", 0.5)
_set_type_eff("Fire", "Fire", 0.5); _set_type_eff("Fire", "Water", 0.5); _set_type_eff("Fire", "Grass", 2.0); _set_type_eff("Fire", "Ice", 2.0); _set_type_eff("Fire", "Bug", 2.0); _set_type_eff("Fire", "Rock", 0.5); _set_type_eff("Fire", "Dragon", 0.5); _set_type_eff("Fire", "Steel", 2.0)
_set_type_eff("Water", "Fire", 2.0); _set_type_eff("Water", "Water", 0.5); _set_type_eff("Water", "Grass", 0.5); _set_type_eff("Water", "Ground", 2.0); _set_type_eff("Water", "Rock", 2.0); _set_type_eff("Water", "Dragon", 0.5)
_set_type_eff("Grass", "Fire", 0.5); _set_type_eff("Grass", "Water", 2.0); _set_type_eff("Grass", "Grass", 0.5); _set_type_eff("Grass", "Poison", 0.5); _set_type_eff("Grass", "Ground", 2.0); _set_type_eff("Grass", "Flying", 0.5); _set_type_eff("Grass", "Bug", 0.5); _set_type_eff("Grass", "Rock", 2.0); _set_type_eff("Grass", "Dragon", 0.5); _set_type_eff("Grass", "Steel", 0.5)
_set_type_eff("Electric", "Water", 2.0); _set_type_eff("Electric", "Grass", 0.5); _set_type_eff("Electric", "Electric", 0.5); _set_type_eff("Electric", "Ground", 0.0); _set_type_eff("Electric", "Flying", 2.0); _set_type_eff("Electric", "Dragon", 0.5)
_set_type_eff("Ice", "Fire", 0.5); _set_type_eff("Ice", "Water", 0.5); _set_type_eff("Ice", "Grass", 2.0); _set_type_eff("Ice", "Ice", 0.5); _set_type_eff("Ice", "Ground", 2.0); _set_type_eff("Ice", "Flying", 2.0); _set_type_eff("Ice", "Dragon", 2.0); _set_type_eff("Ice", "Steel", 0.5)
_set_type_eff("Fighting", "Normal", 2.0); _set_type_eff("Fighting", "Ice", 2.0); _set_type_eff("Fighting", "Poison", 0.5); _set_type_eff("Fighting", "Flying", 0.5); _set_type_eff("Fighting", "Psychic", 0.5); _set_type_eff("Fighting", "Bug", 0.5); _set_type_eff("Fighting", "Rock", 2.0); _set_type_eff("Fighting", "Ghost", 0.0); _set_type_eff("Fighting", "Dark", 2.0); _set_type_eff("Fighting", "Steel", 2.0); _set_type_eff("Fighting", "Fairy", 0.5)
_set_type_eff("Poison", "Grass", 2.0); _set_type_eff("Poison", "Poison", 0.5); _set_type_eff("Poison", "Ground", 0.5); _set_type_eff("Poison", "Rock", 0.5); _set_type_eff("Poison", "Ghost", 0.5); _set_type_eff("Poison", "Steel", 0.0); _set_type_eff("Poison", "Fairy", 2.0)
_set_type_eff("Ground", "Fire", 2.0); _set_type_eff("Ground", "Grass", 0.5); _set_type_eff("Ground", "Electric", 2.0); _set_type_eff("Ground", "Poison", 2.0); _set_type_eff("Ground", "Flying", 0.0); _set_type_eff("Ground", "Bug", 0.5); _set_type_eff("Ground", "Rock", 2.0); _set_type_eff("Ground", "Steel", 2.0)
_set_type_eff("Flying", "Grass", 2.0); _set_type_eff("Flying", "Electric", 0.5); _set_type_eff("Flying", "Fighting", 2.0); _set_type_eff("Flying", "Bug", 2.0); _set_type_eff("Flying", "Rock", 0.5); _set_type_eff("Flying", "Steel", 0.5)
_set_type_eff("Psychic", "Fighting", 2.0); _set_type_eff("Psychic", "Poison", 2.0); _set_type_eff("Psychic", "Psychic", 0.5); _set_type_eff("Psychic", "Dark", 0.0); _set_type_eff("Psychic", "Steel", 0.5)
_set_type_eff("Bug", "Fire", 0.5); _set_type_eff("Bug", "Grass", 2.0); _set_type_eff("Bug", "Fighting", 0.5); _set_type_eff("Bug", "Poison", 0.5); _set_type_eff("Bug", "Flying", 0.5); _set_type_eff("Bug", "Psychic", 2.0); _set_type_eff("Bug", "Ghost", 0.5); _set_type_eff("Bug", "Dark", 2.0); _set_type_eff("Bug", "Steel", 0.5); _set_type_eff("Bug", "Fairy", 0.5)
_set_type_eff("Rock", "Fire", 2.0); _set_type_eff("Rock", "Ice", 2.0); _set_type_eff("Rock", "Fighting", 0.5); _set_type_eff("Rock", "Ground", 0.5); _set_type_eff("Rock", "Flying", 2.0); _set_type_eff("Rock", "Bug", 2.0); _set_type_eff("Rock", "Steel", 0.5)
_set_type_eff("Ghost", "Normal", 0.0); _set_type_eff("Ghost", "Psychic", 2.0); _set_type_eff("Ghost", "Ghost", 2.0); _set_type_eff("Ghost", "Dark", 0.5)
_set_type_eff("Dragon", "Dragon", 2.0); _set_type_eff("Dragon", "Steel", 0.5); _set_type_eff("Dragon", "Fairy", 0.0)
_set_type_eff("Dark", "Fighting", 0.5); _set_type_eff("Dark", "Psychic", 2.0); _set_type_eff("Dark", "Ghost", 2.0); _set_type_eff("Dark", "Dark", 0.5); _set_type_eff("Dark", "Fairy", 0.5)
_set_type_eff("Steel", "Fire", 0.5); _set_type_eff("Steel", "Water", 0.5); _set_type_eff("Steel", "Electric", 0.5); _set_type_eff("Steel", "Ice", 2.0); _set_type_eff("Steel", "Rock", 2.0); _set_type_eff("Steel", "Steel", 0.5); _set_type_eff("Steel", "Fairy", 2.0)
_set_type_eff("Fairy", "Fire", 0.5); _set_type_eff("Fairy", "Fighting", 2.0); _set_type_eff("Fairy", "Poison", 0.5); _set_type_eff("Fairy", "Dragon", 2.0); _set_type_eff("Fairy", "Dark", 2.0); _set_type_eff("Fairy", "Steel", 0.5)

BATTLE_LEVEL = 50
TEAM_SIZE = 3  # ordered party: lead is index 0


def _calc_level50_max_hp(base_hp: int) -> int:
    if base_hp <= 1:
        return 1
    iv, ev = 31, 84
    return math.floor(0.01 * (2 * base_hp + iv + math.floor(0.25 * ev)) * BATTLE_LEVEL) + BATTLE_LEVEL + 10


def _calc_level50_stat(base: int) -> int:
    iv, ev = 31, 84
    return math.floor(0.01 * (2 * base + iv + math.floor(0.25 * ev)) * BATTLE_LEVEL) + 5


def _get_type_effectiveness(move_type: str, defender_types: List[str]) -> float:
    row = TYPE_CHART.get(move_type, {})
    mult = 1.0
    for dt in defender_types:
        mult *= row.get(dt, 1.0)
    return mult


def _calculate_move_damage(move: dict, attacker: dict, defender: dict) -> dict:
    power = move.get("power", 0)
    if power <= 0:
        return {"damage": 0, "effectiveness": 1.0, "critical": False}

    is_physical = move.get("damage_class", "physical") == "physical"
    attacker_stats = attacker.get("stats") or {}
    defender_stats = defender.get("stats") or {}
    atk_stat = attacker_stats.get("attack" if is_physical else "special-attack", 80)
    def_stat = defender_stats.get("defense" if is_physical else "special-defense", 80)
    def_stat = max(1, def_stat)

    move_type = move.get("type", "Normal")
    defender_types = defender.get("types") or ["Normal"]
    type_mult = _get_type_effectiveness(move_type, defender_types)

    if type_mult == 0.0:
        return {"damage": 0, "effectiveness": 0.0, "critical": False}

    is_crit = random.random() < (1 / 16)
    crit_mult = 1.5 if is_crit else 1.0

    attacker_types = attacker.get("types") or []
    stab = 1.5 if move_type in attacker_types else 1.0

    random_mult = random.uniform(0.85, 1.00)

    base_damage = math.floor((((2 * BATTLE_LEVEL) / 5 + 2) * power * (atk_stat / def_stat)) / 50) + 2
    final_damage = max(1, math.floor(base_damage * crit_mult * stab * type_mult * random_mult))

    return {"damage": final_damage, "effectiveness": type_mult, "critical": is_crit}


_PHYSICAL_LEANING_TYPES = {"Normal", "Fighting", "Poison", "Ground", "Flying", "Bug", "Rock", "Ghost", "Steel"}


def _infer_damage_class(move_type: str) -> str:
    return "physical" if move_type in _PHYSICAL_LEANING_TYPES else "special"


POKEMON_BATTLE_POOL = [
    {"name": "Pikachu", "hp": 110, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
     "moves": [{"id": "p_m1", "name": "Thunderbolt", "type": "Electric", "power": 35},
               {"id": "p_m2", "name": "Quick Attack", "type": "Normal", "power": 15},
               {"id": "p_m3", "name": "Iron Tail", "type": "Steel", "power": 25},
               {"id": "p_m4", "name": "Volt Tackle", "type": "Electric", "power": 45}]},
    {"name": "Charizard", "hp": 140, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
     "moves": [{"id": "c_m1", "name": "Flamethrower", "type": "Fire", "power": 35},
               {"id": "c_m2", "name": "Dragon Claw", "type": "Dragon", "power": 25},
               {"id": "c_m3", "name": "Air Slash", "type": "Flying", "power": 20},
               {"id": "c_m4", "name": "Fire Blast", "type": "Fire", "power": 45}]},
    {"name": "Blastoise", "hp": 145, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
     "moves": [{"id": "b_m1", "name": "Hydro Pump", "type": "Water", "power": 40},
               {"id": "b_m2", "name": "Ice Beam", "type": "Ice", "power": 25},
               {"id": "b_m3", "name": "Flash Cannon", "type": "Steel", "power": 20},
               {"id": "b_m4", "name": "Surf", "type": "Water", "power": 30}]},
    {"name": "Venusaur", "hp": 145, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
     "moves": [{"id": "v_m1", "name": "Solar Beam", "type": "Grass", "power": 45},
               {"id": "v_m2", "name": "Sludge Bomb", "type": "Poison", "power": 30},
               {"id": "v_m3", "name": "Giga Drain", "type": "Grass", "power": 20},
               {"id": "v_m4", "name": "Earthquake", "type": "Ground", "power": 35}]},
    {"name": "Gengar", "hp": 120, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
     "moves": [{"id": "g_m1", "name": "Shadow Ball", "type": "Ghost", "power": 35},
               {"id": "g_m2", "name": "Sludge Wave", "type": "Poison", "power": 30},
               {"id": "g_m3", "name": "Dark Pulse", "type": "Dark", "power": 25},
               {"id": "g_m4", "name": "Thunderbolt", "type": "Electric", "power": 25}]},
    {"name": "Lucario", "hp": 130, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
     "moves": [{"id": "l_m1", "name": "Aura Sphere", "type": "Fighting", "power": 35},
               {"id": "l_m2", "name": "Extreme Speed", "type": "Normal", "power": 25},
               {"id": "l_m3", "name": "Close Combat", "type": "Fighting", "power": 45},
               {"id": "l_m4", "name": "Flash Cannon", "type": "Steel", "power": 25}]},
    {"name": "Mewtwo", "hp": 150, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
     "moves": [{"id": "m_m1", "name": "Psystrike", "type": "Psychic", "power": 45},
               {"id": "m_m2", "name": "Shadow Ball", "type": "Ghost", "power": 30},
               {"id": "m_m3", "name": "Aura Sphere", "type": "Fighting", "power": 25},
               {"id": "m_m4", "name": "Ice Beam", "type": "Ice", "power": 25}]},
    {"name": "Garchomp", "hp": 145, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png",
     "moves": [{"id": "gc_m1", "name": "Earthquake", "type": "Ground", "power": 35},
               {"id": "gc_m2", "name": "Dragon Claw", "type": "Dragon", "power": 25},
               {"id": "gc_m3", "name": "Stone Edge", "type": "Rock", "power": 30},
               {"id": "gc_m4", "name": "Outrage", "type": "Dragon", "power": 45}]},
    {"name": "Greninja", "hp": 125, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png",
     "moves": [{"id": "gr_m1", "name": "Water Shuriken", "type": "Water", "power": 30},
               {"id": "gr_m2", "name": "Night Slash", "type": "Dark", "power": 25},
               {"id": "gr_m3", "name": "Ice Beam", "type": "Ice", "power": 25},
               {"id": "gr_m4", "name": "Hydro Cannon", "type": "Water", "power": 45}]},
    {"name": "Dragonite", "hp": 145, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
     "moves": [{"id": "d_m1", "name": "Outrage", "type": "Dragon", "power": 40},
               {"id": "d_m2", "name": "Hurricane", "type": "Flying", "power": 35},
               {"id": "d_m3", "name": "Fire Punch", "type": "Fire", "power": 20},
               {"id": "d_m4", "name": "Extreme Speed", "type": "Normal", "power": 25}]},
    {"name": "Blaziken", "hp": 135, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/257.png",
     "moves": [{"id": "bz_m1", "name": "Blaze Kick", "type": "Fire", "power": 30},
               {"id": "bz_m2", "name": "Sky Uppercut", "type": "Fighting", "power": 25},
               {"id": "bz_m3", "name": "Flare Blitz", "type": "Fire", "power": 45},
               {"id": "bz_m4", "name": "Brave Bird", "type": "Flying", "power": 35}]},
    {"name": "Metagross", "hp": 150, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png",
     "moves": [{"id": "mg_m1", "name": "Meteor Mash", "type": "Steel", "power": 35},
               {"id": "mg_m2", "name": "Zen Headbutt", "type": "Psychic", "power": 25},
               {"id": "mg_m3", "name": "Earthquake", "type": "Ground", "power": 30},
               {"id": "mg_m4", "name": "Hammer Arm", "type": "Fighting", "power": 30}]},
    {"name": "Tyranitar", "hp": 150, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png",
     "moves": [{"id": "ty_m1", "name": "Crunch", "type": "Dark", "power": 30},
               {"id": "ty_m2", "name": "Rock Slide", "type": "Rock", "power": 30},
               {"id": "ty_m3", "name": "Earthquake", "type": "Ground", "power": 35},
               {"id": "ty_m4", "name": "Stone Edge", "type": "Rock", "power": 40}]},
    {"name": "Alakazam", "hp": 110, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png",
     "moves": [{"id": "al_m1", "name": "Psychic", "type": "Psychic", "power": 35},
               {"id": "al_m2", "name": "Focus Blast", "type": "Fighting", "power": 30},
               {"id": "al_m3", "name": "Shadow Ball", "type": "Ghost", "power": 25},
               {"id": "al_m4", "name": "Dazzling Gleam", "type": "Fairy", "power": 25}]},
    {"name": "Gyarados", "hp": 145, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
     "moves": [{"id": "gy_m1", "name": "Waterfall", "type": "Water", "power": 30},
               {"id": "gy_m2", "name": "Earthquake", "type": "Ground", "power": 30},
               {"id": "gy_m3", "name": "Ice Fang", "type": "Ice", "power": 25},
               {"id": "gy_m4", "name": "Crunch", "type": "Dark", "power": 25}]},
    {"name": "Gardevoir", "hp": 125, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png",
     "moves": [{"id": "gar_m1", "name": "Moonblast", "type": "Fairy", "power": 30},
               {"id": "gar_m2", "name": "Psychic", "type": "Psychic", "power": 30},
               {"id": "gar_m3", "name": "Shadow Ball", "type": "Ghost", "power": 25},
               {"id": "gar_m4", "name": "Thunderbolt", "type": "Electric", "power": 20}]},
    {"name": "Scizor", "hp": 135, "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png",
     "moves": [{"id": "sci_m1", "name": "Bullet Punch", "type": "Steel", "power": 15},
               {"id": "sci_m2", "name": "X-Scissor", "type": "Bug", "power": 30},
               {"id": "sci_m3", "name": "Iron Head", "type": "Steel", "power": 30},
               {"id": "sci_m4", "name": "Superpower", "type": "Fighting", "power": 35}]},
]

_FALLBACK_STATS = {
    "attack": _calc_level50_stat(80),
    "defense": _calc_level50_stat(80),
    "special-attack": _calc_level50_stat(80),
    "special-defense": _calc_level50_stat(80),
    "speed": _calc_level50_stat(80),
}

_FALLBACK_TYPES = {
    "Pikachu": ["Electric"], "Charizard": ["Fire", "Flying"], "Blastoise": ["Water"],
    "Venusaur": ["Grass", "Poison"], "Gengar": ["Ghost", "Poison"], "Lucario": ["Fighting", "Steel"],
    "Mewtwo": ["Psychic"], "Garchomp": ["Dragon", "Ground"], "Greninja": ["Water", "Dark"],
    "Dragonite": ["Dragon", "Flying"], "Blaziken": ["Fire", "Fighting"], "Metagross": ["Steel", "Psychic"],
    "Tyranitar": ["Rock", "Dark"], "Alakazam": ["Psychic"], "Gyarados": ["Water", "Flying"],
    "Gardevoir": ["Psychic", "Fairy"], "Scizor": ["Bug", "Steel"],
}


def generate_random_battle_pokemon(user_id: str) -> dict:
    template = random.choice(POKEMON_BATTLE_POOL)
    moves = []
    for m in template["moves"]:
        mv = dict(m)
        mv.setdefault("damage_class", _infer_damage_class(mv.get("type", "Normal")))
        moves.append(mv)
    return {
        "id": user_id,
        "name": template["name"],
        "current_hp": template["hp"],
        "max_hp": template["hp"],
        "sprite_url": template["sprite_url"],
        "types": _FALLBACK_TYPES.get(template["name"], ["Normal"]),
        "stats": _FALLBACK_STATS,
        "moves": moves,
    }


POKEMON_API_CACHE: Dict[int, dict] = {}
MOVE_API_CACHE: Dict[str, dict] = {}

from concurrent.futures import ThreadPoolExecutor, as_completed

_move_fetch_executor = ThreadPoolExecutor(max_workers=10)


def _fetch_moves_concurrently(candidate_names: List[str], limit: int) -> List[dict]:
    found: List[dict] = []
    if not candidate_names:
        return found

    futures = {
        _move_fetch_executor.submit(_fetch_move_detail, name): name for name in candidate_names
    }
    for future in as_completed(futures):
        try:
            detail = future.result()
        except Exception as e:
            print(f"[Battle Roster] Move fetch thread error: {e}")
            detail = None
        if detail:
            found.append(dict(detail))
        if len(found) >= limit:
            break
    return found[:limit]


def _fetch_pokemon_base(pokemon_id: int) -> Optional[dict]:
    cached = POKEMON_API_CACHE.get(pokemon_id)
    if cached:
        return cached
    try:
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}", timeout=5).json()
        name = res["name"].replace("-", " ").title()
        base_stats = {s["stat"]["name"]: s["base_stat"] for s in res["stats"]}
        types = [t["type"]["name"].capitalize() for t in res["types"]]

        max_hp = _calc_level50_max_hp(base_stats.get("hp", 80))
        stats = {
            "attack": _calc_level50_stat(base_stats.get("attack", 80)),
            "defense": _calc_level50_stat(base_stats.get("defense", 80)),
            "special-attack": _calc_level50_stat(base_stats.get("special-attack", 80)),
            "special-defense": _calc_level50_stat(base_stats.get("special-defense", 80)),
            "speed": _calc_level50_stat(base_stats.get("speed", 80)),
        }

        sprite = (
            res["sprites"]["other"]["official-artwork"]["front_default"]
            or res["sprites"]["front_default"]
        )
        move_names = [m["move"]["name"] for m in res["moves"]]
        data = {
            "name": name,
            "hp": max_hp,
            "types": types,
            "stats": stats,
            "sprite_url": sprite or "",
            "move_pool": move_names,
        }
        POKEMON_API_CACHE[pokemon_id] = data
        return data
    except Exception as e:
        print(f"[Battle Roster] Failed to fetch pokemon {pokemon_id}: {e}")
        return None


def _fetch_move_detail(move_name: str) -> Optional[dict]:
    cached = MOVE_API_CACHE.get(move_name)
    if cached is not None:
        return cached if cached else None
    try:
        res = requests.get(f"https://pokeapi.co/api/v2/move/{move_name}", timeout=5).json()
        power = res.get("power")
        if not power:
            MOVE_API_CACHE[move_name] = {}
            return None
        move_type = res["type"]["name"].capitalize()
        display_name = res["name"].replace("-", " ").title()
        damage_class = (res.get("damage_class") or {}).get("name", "physical")
        data = {"name": display_name, "type": move_type, "power": int(power), "damage_class": damage_class}
        MOVE_API_CACHE[move_name] = data
        return data
    except Exception as e:
        print(f"[Battle Roster] Failed to fetch move {move_name}: {e}")
        return None


def _build_battle_pokemon_from_api(user_id: str) -> Optional[dict]:
    pokemon_id = random.randint(1, 1025)
    base = _fetch_pokemon_base(pokemon_id)
    if not base or not base["move_pool"]:
        return None

    candidates = base["move_pool"][:]
    random.shuffle(candidates)

    chosen_moves = _fetch_moves_concurrently(candidates[:30], limit=4)

    if len(chosen_moves) < 4:
        return None

    return {
        "id": user_id,
        "name": base["name"],
        "current_hp": base["hp"],
        "max_hp": base["hp"],
        "sprite_url": base["sprite_url"],
        "types": base["types"],
        "stats": base["stats"],
        "moves": chosen_moves,
    }


def generate_random_battle_pokemon_any(user_id: str) -> dict:
    try:
        result = _build_battle_pokemon_from_api(user_id)
        if result:
            return result
    except Exception as e:
        print(f"[Battle Roster] Live roster generation failed, using fallback pool: {e}")
    return generate_random_battle_pokemon(user_id)


async def generate_random_battle_pokemon_async(user_id: str) -> dict:
    return await asyncio.to_thread(generate_random_battle_pokemon_any, user_id)


# --- TEAM BUILDER: SEARCH + SPECIES DETAIL ---

POKEMON_NAME_INDEX: List[Dict] = []


def _ensure_name_index() -> List[Dict]:
    global POKEMON_NAME_INDEX
    if POKEMON_NAME_INDEX:
        return POKEMON_NAME_INDEX
    try:
        res = requests.get("https://pokeapi.co/api/v2/pokemon?limit=1025", timeout=10).json()
        index = []
        for i, entry in enumerate(res.get("results", []), start=1):
            index.append({"id": i, "name": entry["name"].replace("-", " ").title()})
        POKEMON_NAME_INDEX = index
    except Exception as e:
        print(f"[Battle Roster] Failed to build name index: {e}")
    return POKEMON_NAME_INDEX


@app.get("/api/battle/roster/search")
def search_battle_roster(q: str = ""):
    index = _ensure_name_index()
    query = q.strip().lower()
    if not query:
        return index[:20]
    matches = [p for p in index if query in p["name"].lower()]
    return matches[:20]


@app.get("/api/battle/roster/{pokemon_id}")
def get_battle_roster_pokemon(pokemon_id: int):
    if not (1 <= pokemon_id <= 1025):
        raise HTTPException(status_code=400, detail="Pokémon ID out of range.")

    base = _fetch_pokemon_base(pokemon_id)
    if not base:
        raise HTTPException(status_code=404, detail="Could not load that Pokémon right now.")

    candidates = base["move_pool"][:]
    random.shuffle(candidates)

    move_details = _fetch_moves_concurrently(candidates[:40], limit=20)
    move_options = []
    for detail in move_details:
        matched_key = next(
            (name for name in candidates[:40] if name.replace('-', ' ').title() == detail["name"]),
            detail["name"].lower().replace(' ', '-'),
        )
        move_options.append({**detail, "move_key": matched_key})

    return {
        "id": pokemon_id,
        "name": base["name"],
        "hp": base["hp"],
        "sprite_url": base["sprite_url"],
        "moves": move_options,
    }


# ============================================================
# PARTY BUILDING (3 ordered Pokémon per trainer)
# ============================================================

def _tag_move_ids(pokemon: dict, slot: int) -> dict:
    """Move ids must be unique across a whole party, not just within one
    Pokémon - otherwise a 'use_move' id could match a benched member's move
    and the wrong move would resolve."""
    for idx, mv in enumerate(pokemon.get("moves", [])):
        mv["id"] = f"s{slot}_m{idx}"
    pokemon["slot"] = slot
    return pokemon


def _normalize_selection(selection: Any) -> List[dict]:
    """Accepts the new party payload {"team": [{pokemon_id, moves}, ...]},
    a bare list of the same, or the OLD single-Pokémon payload
    {"pokemon_id", "moves"} so older clients keep working."""
    if not selection:
        return []

    if isinstance(selection, dict):
        if isinstance(selection.get("team"), list):
            picks = selection["team"]
        elif selection.get("pokemon_id") is not None:
            picks = [selection]
        else:
            return []
    elif isinstance(selection, list):
        picks = selection
    else:
        return []

    normalized: List[dict] = []
    for pick in picks[:TEAM_SIZE]:
        if not isinstance(pick, dict):
            continue
        try:
            pid = int(pick.get("pokemon_id"))
        except (TypeError, ValueError):
            continue
        if not (1 <= pid <= 1025):
            continue
        raw_moves = pick.get("moves") or []
        moves = [m for m in raw_moves if isinstance(m, str)][:4]
        normalized.append({"pokemon_id": pid, "moves": moves})
    return normalized


def _build_one_from_pick(user_id: str, pick: dict, slot: int) -> dict:
    """Server-side re-validation: only pokemon_id and move names are trusted
    from the client; stats/power are always re-derived from PokeAPI data."""
    pokemon_id = pick["pokemon_id"]
    base = _fetch_pokemon_base(pokemon_id)
    if not base:
        return _tag_move_ids(generate_random_battle_pokemon_any(user_id), slot)

    valid_pool = set(base["move_pool"])
    valid_requested = [mv for mv in pick["moves"] if mv in valid_pool][:4]
    chosen_moves = _fetch_moves_concurrently(valid_requested, limit=4)

    if len(chosen_moves) < 4:
        backfill = [m for m in base["move_pool"] if m not in pick["moves"]]
        random.shuffle(backfill)
        chosen_moves.extend(_fetch_moves_concurrently(backfill[:20], limit=4 - len(chosen_moves)))

    if not chosen_moves:
        return _tag_move_ids(generate_random_battle_pokemon_any(user_id), slot)

    return _tag_move_ids({
        "id": user_id,
        "name": base["name"],
        "current_hp": base["hp"],
        "max_hp": base["hp"],
        "sprite_url": base["sprite_url"],
        "types": base["types"],
        "stats": base["stats"],
        "moves": chosen_moves,
    }, slot)


def _build_battle_team(user_id: str, selection: Any) -> List[dict]:
    """Builds this trainer's ordered party. Index 0 is the lead that comes
    out at the start of the match. A player who queues without a built party
    (or whose payload fails validation) gets a random party of the same
    size, so both sides always have the same number of battlers."""
    picks = _normalize_selection(selection)
    team: List[dict] = []

    for slot, pick in enumerate(picks):
        try:
            team.append(_build_one_from_pick(user_id, pick, slot))
        except Exception as e:
            print(f"[Battle Roster] Party slot {slot} build failed: {e}")
            team.append(_tag_move_ids(generate_random_battle_pokemon_any(user_id), slot))

    while len(team) < TEAM_SIZE:
        slot = len(team)
        mon = generate_random_battle_pokemon_any(user_id)
        existing_names = {m["name"] for m in team}
        attempts = 0
        while mon["name"] in existing_names and attempts < 4:
            mon = generate_random_battle_pokemon_any(user_id)
            attempts += 1
        team.append(_tag_move_ids(mon, slot))

    return team[:TEAM_SIZE]


async def build_battle_team_async(user_id: str, selection: Any) -> List[dict]:
    return await asyncio.to_thread(_build_battle_team, user_id, selection)


# ============================================================
# BATTLE RESULT PERSISTENCE
# ============================================================
# The arena's `user_id` throughout this module is the raw string sent as
# the `?token=` query param - the SAME string /api/users/me treats as the
# trainer's email (see get_current_user: `authorization.split(" ")[1]` is
# used directly as `models.User.email`). So a battle result is looked up
# by matching that string against User.email, then handed to the existing
# crud.update_player_xp_and_stats - the same helper the REST battle
# schemas implied but nothing ever actually called.

def _get_db_session():
    """Pulls one Session out of the get_db() dependency generator for use
    outside of FastAPI's Depends() injection - there's no request to
    inject into from inside websocket/background code."""
    gen = get_db()
    db = next(gen)
    return db, gen


def _close_db_session(gen) -> None:
    try:
        next(gen)
    except StopIteration:
        pass
    except Exception as e:
        print(f"[Battle Stats] DB session cleanup error: {e}")


def _persist_battle_result_sync(user_email: str, is_winner: bool, critical_hits: int = 0) -> None:
    db, gen = _get_db_session()
    try:
        user = db.query(models.User).filter(models.User.email == user_email).first()
        if not user:
            print(f"[Battle Stats] No user found for '{user_email}'; skipping stat update.")
            return
        crud.update_player_xp_and_stats(db, user.id, is_winner=is_winner, critical_hits=critical_hits)
        print(f"[Battle Stats] {user_email}: {'WIN' if is_winner else 'LOSS'} recorded (crits={critical_hits}).")
    except Exception as e:
        print(f"[Battle Stats] Failed to persist result for {user_email}: {e}")
    finally:
        _close_db_session(gen)


async def persist_battle_result(user_email: str, is_winner: bool, critical_hits: int = 0) -> None:
    """Runs the blocking SQLAlchemy update off the event loop thread.
    Callers fire this with asyncio.create_task rather than awaiting it
    directly, so a slow DB write never delays state_update/game_over
    delivery to either player."""
    await asyncio.to_thread(_persist_battle_result_sync, user_email, is_winner, critical_hits)


class BattleRoom:
    """
    3v3 single battles with switching.

    status lifecycle:
      "ongoing"   -> turns being played
      "finished"  -> one side's whole party fainted; rematch-eligible
      "abandoned" -> someone exited/disconnected; terminal
    """

    def __init__(self, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket,
                 p1_team: List[dict], p2_team: List[dict],
                 p1_selection: Any = None, p2_selection: Any = None):
        self.room_id = room_id
        self.p1_id = p1_id
        self.p2_id = p2_id

        self.sockets: Dict[str, WebSocket] = {p1_id: p1_ws, p2_id: p2_ws}
        self.teams: Dict[str, List[dict]] = {p1_id: p1_team, p2_id: p2_team}
        self.active_index: Dict[str, int] = {p1_id: 0, p2_id: 0}
        self.selections: Dict[str, Any] = {p1_id: p1_selection, p2_id: p2_selection}

        self.turn = 1
        # user_id -> {"type": "move", "move_id": str} | {"type": "switch", "index": int}
        self.pending_actions: Dict[str, dict] = {}
        # players who must pick a replacement after a faint (free, not a turn)
        self.awaiting_switch: Set[str] = set()
        self.rematch_votes: Set[str] = set()
        self.status = "ongoing"
        self.winner = None
        # Tallied for crud.update_player_xp_and_stats' critical_hits param
        # when the battle concludes; reset on each rematch.
        self.crit_counts: Dict[str, int] = {p1_id: 0, p2_id: 0}

    # ---------- helpers ----------

    @property
    def players(self) -> List[str]:
        return [self.p1_id, self.p2_id]

    def opponent_of(self, user_id: str) -> str:
        return self.p2_id if user_id == self.p1_id else self.p1_id

    def active_of(self, user_id: str) -> dict:
        return self.teams[user_id][self.active_index[user_id]]

    def has_alive(self, user_id: str) -> bool:
        return any(m["current_hp"] > 0 for m in self.teams[user_id])

    def _team_summary(self, user_id: str) -> List[dict]:
        return [
            {
                "index": i,
                "name": m["name"],
                "sprite_url": m.get("sprite_url", ""),
                "types": m.get("types", []),
                "current_hp": m["current_hp"],
                "max_hp": m["max_hp"],
                "fainted": m["current_hp"] <= 0,
                "is_active": i == self.active_index[user_id],
            }
            for i, m in enumerate(self.teams[user_id])
        ]

    def _can_switch_to(self, user_id: str, index: Any) -> bool:
        try:
            index = int(index)
        except (TypeError, ValueError):
            return False
        if not (0 <= index < len(self.teams[user_id])):
            return False
        if index == self.active_index[user_id]:
            return False
        return self.teams[user_id][index]["current_hp"] > 0

    # ---------- plumbing ----------

    def rebind_socket(self, user_id: str, websocket: WebSocket) -> None:
        if user_id in self.sockets:
            self.sockets[user_id] = websocket

    # Kept for compatibility with any older references.
    @property
    def p1_pokemon(self) -> dict:
        return self.active_of(self.p1_id)

    @property
    def p2_pokemon(self) -> dict:
        return self.active_of(self.p2_id)

    def get_state_for_player(self, user_id: str) -> dict:
        foe = self.opponent_of(user_id)
        payload = {
            "type": "state_update",
            "state": {
                "turn": self.turn,
                "active_pokemon": self.active_of(user_id),
                "opponent_pokemon": self.active_of(foe),
                "my_team": self._team_summary(user_id),
                "opponent_team": self._team_summary(foe),
                "status": self.status,
                "must_switch": user_id in self.awaiting_switch,
                "opponent_must_switch": foe in self.awaiting_switch,
                "action_locked": user_id in self.pending_actions,
                "rematch_requested_by_me": user_id in self.rematch_votes,
                "rematch_votes_count": len(self.rematch_votes),
            }
        }
        if self.winner:
            payload["state"]["winner"] = self.winner
        return payload

    async def send_to(self, user_id: str, message: dict):
        ws = self.sockets.get(user_id)
        if not ws:
            return
        try:
            await ws.send_json(message)
        except Exception as e:
            print(f"[Room {self.room_id}] Send error for {user_id}: {e}")

    async def broadcast_states(self):
        for uid in self.players:
            await self.send_to(uid, self.get_state_for_player(uid))

    async def broadcast_log(self, text: str):
        log_msg = {"type": "log", "log": {"text": text, "timestamp": int(time.time() * 1000)}}
        for uid in self.players:
            await self.send_to(uid, log_msg)

    async def broadcast_game_over(self):
        for uid in self.players:
            await self.send_to(uid, {
                "type": "game_over",
                "winner": self.winner,
                "available_actions": ["rematch", "exit"],
                "state": self.get_state_for_player(uid)["state"],
            })

    # ---------- action intake ----------

    async def handle_action(self, user_id: str, move_id: str):
        """A move choice for this turn."""
        if self.status != "ongoing":
            return
        if self.awaiting_switch:
            # someone still has to send out a replacement; no moves yet
            return
        if user_id in self.pending_actions:
            return
        if self.active_of(user_id)["current_hp"] <= 0:
            return

        self.pending_actions[user_id] = {"type": "move", "move_id": move_id}
        await self._maybe_resolve("Move selected! Waiting for opposing trainer...", user_id)

    async def handle_switch(self, user_id: str, index: Any):
        """A switch. Forced (post-faint) switches are free; a voluntary
        switch is locked in as this trainer's whole action for the turn, so
        the opponent still gets to attack while the swap happens."""
        if self.status != "ongoing":
            return

        if user_id in self.awaiting_switch:
            if not self._can_switch_to(user_id, index):
                return
            await self._perform_switch(user_id, int(index), voluntary=False)
            self.awaiting_switch.discard(user_id)

            if not self.awaiting_switch:
                self.turn += 1
                self.pending_actions.clear()
            await self.broadcast_states()
            return

        if self.awaiting_switch:
            return  # opponent still choosing a replacement
        if user_id in self.pending_actions:
            return
        if not self._can_switch_to(user_id, index):
            return

        self.pending_actions[user_id] = {"type": "switch", "index": int(index)}
        await self._maybe_resolve("Switch locked in! Waiting for opposing trainer...", user_id)

    async def _maybe_resolve(self, ack_text: str, user_id: str):
        if len(self.pending_actions) < 2:
            await self.send_to(user_id, {
                "type": "log",
                "log": {"text": ack_text, "timestamp": int(time.time() * 1000)},
            })
            await self.broadcast_states()
            return
        await self.resolve_turn()

    # ---------- battle mechanics ----------

    async def _perform_switch(self, user_id: str, index: int, voluntary: bool):
        outgoing = self.active_of(user_id)
        self.active_index[user_id] = index
        incoming = self.active_of(user_id)

        if voluntary:
            await self.broadcast_log(f"{outgoing['name']} was withdrawn! Go, {incoming['name']}!")
        else:
            await self.broadcast_log(f"{incoming['name']} was sent out!")

    async def _execute_attack(self, attacker_id: str, move_id: Optional[str]):
        attacker = self.active_of(attacker_id)
        defender_id = self.opponent_of(attacker_id)
        defender = self.active_of(defender_id)

        move = next((m for m in attacker["moves"] if m["id"] == move_id), attacker["moves"][0])

        await self.broadcast_log(f"{attacker['name']} used {move['name']}!")
        result = _calculate_move_damage(move, attacker, defender)

        if result["effectiveness"] == 0.0:
            await self.broadcast_log(f"It had no effect on {defender['name']}!")
            return

        defender["current_hp"] = max(0, defender["current_hp"] - result["damage"])

        if result["critical"]:
            self.crit_counts[attacker_id] = self.crit_counts.get(attacker_id, 0) + 1
            await self.broadcast_log("A critical hit!")
        if result["effectiveness"] > 1.0:
            await self.broadcast_log("It's super effective!")
        elif result["effectiveness"] < 1.0:
            await self.broadcast_log("It's not very effective...")

        await self.broadcast_log(f"{defender['name']} took {result['damage']} damage!")

        if defender["current_hp"] <= 0:
            await self.broadcast_log(f"{defender['name']} fainted!")

    async def resolve_turn(self):
        actions = dict(self.pending_actions)
        self.pending_actions.clear()

        # 1. Switches happen first - that IS the switcher's action this turn.
        for uid in self.players:
            act = actions.get(uid)
            if act and act.get("type") == "switch" and self._can_switch_to(uid, act.get("index")):
                await self._perform_switch(uid, int(act["index"]), voluntary=True)

        # 2. Attacks, faster active Pokémon first.
        attackers = [uid for uid in self.players if (actions.get(uid) or {}).get("type") == "move"]
        attackers.sort(
            key=lambda uid: (self.active_of(uid).get("stats", {}).get("speed", 0), random.random()),
            reverse=True,
        )

        for uid in attackers:
            if self.active_of(uid)["current_hp"] <= 0:
                continue
            if self.active_of(self.opponent_of(uid))["current_hp"] <= 0:
                continue
            await self._execute_attack(uid, (actions.get(uid) or {}).get("move_id"))

        # 3. Faints / win check.
        if await self._resolve_faints():
            return

        if self.awaiting_switch:
            await self.broadcast_states()
            return

        self.turn += 1
        await self.broadcast_states()

    async def _resolve_faints(self) -> bool:
        """Returns True if the whole battle ended."""
        wiped = [uid for uid in self.players if not self.has_alive(uid)]

        if wiped:
            self.status = "finished"
            self.winner = None if len(wiped) == 2 else self.opponent_of(wiped[0])
            if self.winner:
                await self.broadcast_log("All of the opposing Pokémon fainted! Victory declared!")
                loser_id = wiped[0]
                # Fire-and-forget: the DB write must never hold up state
                # delivery to either player. Draws are skipped - there's no
                # fair is_winner value to record for either side.
                asyncio.create_task(
                    persist_battle_result(self.winner, True, self.crit_counts.get(self.winner, 0))
                )
                asyncio.create_task(
                    persist_battle_result(loser_id, False, self.crit_counts.get(loser_id, 0))
                )
            else:
                await self.broadcast_log("Both parties were wiped out! It's a draw!")
            await self.broadcast_states()
            await self.broadcast_game_over()
            return True

        for uid in self.players:
            if self.active_of(uid)["current_hp"] <= 0:
                self.awaiting_switch.add(uid)
                await self.send_to(uid, {
                    "type": "log",
                    "log": {"text": "Choose your next Pokémon!", "timestamp": int(time.time() * 1000)},
                })
        return False

    # ---------- rematch / exit ----------

    async def handle_rematch(self, user_id: str):
        if self.status != "finished":
            return

        self.rematch_votes.add(user_id)

        if len(self.rematch_votes) == 1:
            await self.send_to(self.opponent_of(user_id), {
                "type": "rematch_status",
                "text": "Opponent wants a rematch! Click Rematch to accept.",
                "opponent_wants_rematch": True,
            })
            await self.broadcast_log("Trainer requested a rematch!")
            await self.broadcast_states()

        elif len(self.rematch_votes) >= 2:
            rebuilt = await asyncio.gather(
                build_battle_team_async(self.p1_id, self.selections.get(self.p1_id)),
                build_battle_team_async(self.p2_id, self.selections.get(self.p2_id)),
            )
            self.teams[self.p1_id], self.teams[self.p2_id] = rebuilt
            self.active_index = {self.p1_id: 0, self.p2_id: 0}

            self.turn = 1
            self.pending_actions.clear()
            self.awaiting_switch.clear()
            self.rematch_votes.clear()
            self.status = "ongoing"
            self.winner = None
            self.crit_counts = {self.p1_id: 0, self.p2_id: 0}

            await self.broadcast_log(
                f"Rematch accepted! {self.active_of(self.p1_id)['name']} vs {self.active_of(self.p2_id)['name']}!"
            )
            await self.broadcast_states()

    async def handle_exit(self, user_id: str):
        if self.status == "abandoned":
            return

        other_id = self.opponent_of(user_id)
        rematch_was_pending = self.status == "finished" and len(self.rematch_votes) > 0
        # Distinguish "quit mid-fight" from "declined a rematch after a
        # battle that already concluded (and was already persisted) by a
        # faint" - only the former still owes a win/loss record.
        battle_was_ongoing = self.status == "ongoing"

        if rematch_was_pending and other_id in self.rematch_votes:
            await self.send_to(other_id, {
                "type": "rematch_declined",
                "text": "Opponent left instead of accepting the rematch.",
            })
        else:
            await self.send_to(other_id, {
                "type": "opponent_left",
                "text": "Opponent left the battle.",
            })

        self.rematch_votes.clear()
        self.awaiting_switch.clear()
        self.status = "abandoned"

        if battle_was_ongoing:
            # Matches the +50 XP the frontend already shows on its
            # "opponent left" screen - the remaining trainer is credited
            # with the win, and the one who quit takes the loss.
            asyncio.create_task(
                persist_battle_result(other_id, True, self.crit_counts.get(other_id, 0))
            )
            asyncio.create_task(
                persist_battle_result(user_id, False, self.crit_counts.get(user_id, 0))
            )


class BattleMatchmaker:
    def __init__(self):
        self.waiting_player: Optional[tuple] = None  # (user_id, websocket, selection)
        self.active_rooms: Dict[str, BattleRoom] = {}
        self.active_connections: Dict[str, WebSocket] = {}

    async def register_connection(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

        existing_room = self.find_room(user_id)
        if existing_room:
            existing_room.rebind_socket(user_id, websocket)
            await websocket.send_json(existing_room.get_state_for_player(user_id))
            print(f"[Matchmaker] Rebound socket for Trainer {user_id} to room {existing_room.room_id}")
        else:
            await websocket.send_json({
                "type": "connected",
                "text": "Connected to Battle Arena. Send 'find_match' action to search for an opponent."
            })
            print(f"[Matchmaker] Registered socket for Trainer: {user_id}")

    async def join_queue(self, user_id: str, selection: Any = None):
        websocket = self.active_connections.get(user_id)
        if not websocket:
            return

        if self.find_room(user_id):
            try:
                await websocket.send_json({
                    "type": "log",
                    "log": {
                        "text": "You're already in a battle. Finish it, exit, or rematch instead.",
                        "timestamp": int(time.time() * 1000),
                    }
                })
            except Exception:
                pass
            return

        if self.waiting_player and self.waiting_player[0] != user_id:
            p1_id, p1_ws, p1_selection = self.waiting_player
            self.waiting_player = None

            try:
                room_id = f"arena_{uuid.uuid4().hex[:12]}"
                p1_team, p2_team = await asyncio.gather(
                    build_battle_team_async(p1_id, p1_selection),
                    build_battle_team_async(user_id, selection),
                )
                room = BattleRoom(room_id, p1_id, p1_ws, user_id, websocket,
                                  p1_team, p2_team, p1_selection, selection)
                self.active_rooms[room_id] = room

                await room.broadcast_log(
                    f"Match started! {room.active_of(p1_id)['name']} vs {room.active_of(user_id)['name']}!"
                )
                await room.broadcast_states()
                print(f"[Matchmaker] New room initialized: {room_id}")
            except Exception as e:
                import traceback
                print(f"[Matchmaker] Room creation failed for {p1_id} vs {user_id}: {e}")
                traceback.print_exc()

                self.waiting_player = (p1_id, p1_ws, p1_selection)
                try:
                    await websocket.send_json({
                        "type": "log",
                        "log": {
                            "text": "Match creation hit a snag - please press Find Match again.",
                            "timestamp": int(time.time() * 1000),
                        }
                    })
                except Exception:
                    pass
        else:
            self.waiting_player = (user_id, websocket, selection)
            try:
                await websocket.send_json({
                    "type": "log",
                    "log": {"text": "Searching for an online opponent...", "timestamp": int(time.time() * 1000)}
                })
            except Exception:
                pass
            print(f"[Matchmaker] Trainer {user_id} added to waiting queue.")

    def leave_queue(self, user_id: str):
        if self.waiting_player and self.waiting_player[0] == user_id:
            self.waiting_player = None
            print(f"[Matchmaker] Trainer {user_id} removed from queue.")

    def find_room(self, user_id: str) -> Optional[BattleRoom]:
        for room in list(self.active_rooms.values()):
            if user_id in (room.p1_id, room.p2_id) and room.status != "abandoned":
                return room
        return None

    def remove_room(self, room_id: str):
        if room_id in self.active_rooms:
            del self.active_rooms[room_id]
            print(f"[Matchmaker] Room {room_id} cleaned up.")

    async def disconnect(self, user_id: str, websocket: WebSocket):
        """Grace-window disconnect. The identity check keeps an old,
        already-superseded socket's disconnect from deleting the entry that
        points at a brand-new, working connection."""
        self.leave_queue(user_id)

        if self.active_connections.get(user_id) is websocket:
            del self.active_connections[user_id]
        else:
            print(f"[Matchmaker] Ignoring stale disconnect for {user_id} - a newer connection is already active.")
            return

        room = self.find_room(user_id)
        if not room:
            return

        asyncio.create_task(self._finalize_disconnect(user_id, room.room_id))

    async def _finalize_disconnect(self, user_id: str, room_id: str, grace_seconds: float = 45.0) -> None:
        await asyncio.sleep(grace_seconds)

        if user_id in self.active_connections:
            return

        room = self.active_rooms.get(room_id)
        if not room:
            return

        await room.handle_exit(user_id)
        self.remove_room(room_id)


matchmaker = BattleMatchmaker()


@app.websocket("/ws")
async def alias_battle_websocket_endpoint(websocket: WebSocket, token: str = "guest"):
    await battle_websocket_endpoint(websocket, token)


@app.websocket("/api/battle/ws")
async def battle_websocket_endpoint(websocket: WebSocket, token: str = "guest"):
    user_id = token
    await matchmaker.register_connection(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()

            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                print(f"[Battle Arena] Received invalid JSON from {user_id}")
                continue

            action = parsed.get("action")

            try:
                if action == "find_match":
                    selection = parsed.get("selection")
                    await matchmaker.join_queue(user_id, selection)
                elif action == "cancel_search":
                    matchmaker.leave_queue(user_id)
                elif action == "ping":
                    pass
                else:
                    room = matchmaker.find_room(user_id)
                    if room:
                        if action == "use_move":
                            await room.handle_action(user_id, parsed.get("moveId"))
                        elif action == "switch":
                            await room.handle_switch(user_id, parsed.get("index"))
                        elif action == "rematch":
                            await room.handle_rematch(user_id)
                        elif action == "exit":
                            await room.handle_exit(user_id)
                            matchmaker.remove_room(room.room_id)
            except Exception as e:
                import traceback
                print(f"[Battle Arena] Error handling action '{action}' for {user_id}: {e}")
                traceback.print_exc()

    except WebSocketDisconnect:
        await matchmaker.disconnect(user_id, websocket)
        print(f"[Battle Arena] Trainer {user_id} disconnected.")