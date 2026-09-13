from fastapi import FastAPI, HTTPException, status, Header, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Set
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

    # FIX: Return the same minimal shape as /api/auth/login (message, email,
    # username) instead of the full UserResponse model. The frontend's
    # session-establishment logic extracts an identity token from exactly
    # these fields after both register AND login - previously register
    # returned a differently-shaped UserResponse object with no matching
    # top-level field, so "Unable to establish user session from backend
    # response" fired immediately after every successful registration, even
    # though the account was created fine (which is why signing in right
    # after always worked).
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

# --- TYPE EFFECTIVENESS + AUTHENTIC DAMAGE FORMULA ---
# Ports the same style of level-50 stat/damage math into this actually-
# running battle system, so damage now depends on real Attack/Defense
# stats, STAB, and type matchups instead of just subtracting a move's raw
# power from HP.

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

BATTLE_LEVEL = 50  # Champions-style: fixed level, no in-battle leveling; all stats are pre-computed from base stats.


def _calc_level50_max_hp(base_hp: int) -> int:
    if base_hp <= 1:
        return 1  # Shedinja-style 1 HP species
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
    """Real Gen 6+ style damage formula: level, Attack/Defense (or
    Sp.Atk/Sp.Def for special moves), STAB, type effectiveness, a critical
    hit chance, and the usual 0.85-1.00 random roll - instead of just
    subtracting the move's raw power from HP."""
    power = move.get("power", 0)
    if power <= 0:
        return {"damage": 0, "effectiveness": 1.0, "critical": False}

    is_physical = move.get("damage_class", "physical") == "physical"
    attacker_stats = attacker.get("stats") or {}
    defender_stats = defender.get("stats") or {}
    atk_stat = attacker_stats.get("attack" if is_physical else "special-attack", 80)
    def_stat = defender_stats.get("defense" if is_physical else "special-defense", 80)
    def_stat = max(1, def_stat)  # guard against divide-by-zero on malformed data

    move_type = move.get("type", "Normal")
    defender_types = defender.get("types") or ["Normal"]
    type_mult = _get_type_effectiveness(move_type, defender_types)

    if type_mult == 0.0:
        print(f"[Damage Debug] {move.get('name')} ({move_type}) vs {defender.get('name')} "
              f"types={defender_types} -> IMMUNE")
        return {"damage": 0, "effectiveness": 0.0, "critical": False}

    is_crit = random.random() < (1 / 16)  # Gen 6+ base crit rate
    crit_mult = 1.5 if is_crit else 1.0

    attacker_types = attacker.get("types") or []
    stab = 1.5 if move_type in attacker_types else 1.0

    random_mult = random.uniform(0.85, 1.00)

    base_damage = math.floor((((2 * BATTLE_LEVEL) / 5 + 2) * power * (atk_stat / def_stat)) / 50) + 2
    final_damage = math.floor(base_damage * crit_mult * stab * type_mult * random_mult)
    final_damage = max(1, final_damage)

    print(
        f"[Damage Debug] {move.get('name')} ({move_type}, class={move.get('damage_class')}, power={power}) "
        f"| attacker={attacker.get('name')} types={attacker_types} atk_stat={atk_stat} "
        f"| defender={defender.get('name')} types={defender_types} def_stat={def_stat} "
        f"| stab={stab} type_mult={type_mult} crit={is_crit} random={random_mult:.2f} "
        f"| base_damage={base_damage} -> final={final_damage}"
    )

    return {"damage": final_damage, "effectiveness": type_mult, "critical": is_crit}


# Pre-Physical/Special-split-era types skewed physical; used only as a
# fallback categorization for the curated static pool below, whose moves
# don't come with a real damage_class from PokeAPI.
_PHYSICAL_LEANING_TYPES = {"Normal", "Fighting", "Poison", "Ground", "Flying", "Bug", "Rock", "Ghost", "Steel"}


def _infer_damage_class(move_type: str) -> str:
    return "physical" if move_type in _PHYSICAL_LEANING_TYPES else "special"


POKEMON_BATTLE_POOL = [
    {
        "name": "Pikachu",
        "hp": 110,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
        "moves": [
            {"id": "p_m1", "name": "Thunderbolt", "type": "Electric", "power": 35},
            {"id": "p_m2", "name": "Quick Attack", "type": "Normal", "power": 15},
            {"id": "p_m3", "name": "Iron Tail", "type": "Steel", "power": 25},
            {"id": "p_m4", "name": "Volt Tackle", "type": "Electric", "power": 45}
        ]
    },
    {
        "name": "Charizard",
        "hp": 140,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
        "moves": [
            {"id": "c_m1", "name": "Flamethrower", "type": "Fire", "power": 35},
            {"id": "c_m2", "name": "Dragon Claw", "type": "Dragon", "power": 25},
            {"id": "c_m3", "name": "Air Slash", "type": "Flying", "power": 20},
            {"id": "c_m4", "name": "Fire Blast", "type": "Fire", "power": 45}
        ]
    },
    {
        "name": "Blastoise",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
        "moves": [
            {"id": "b_m1", "name": "Hydro Pump", "type": "Water", "power": 40},
            {"id": "b_m2", "name": "Ice Beam", "type": "Ice", "power": 25},
            {"id": "b_m3", "name": "Flash Cannon", "type": "Steel", "power": 20},
            {"id": "b_m4", "name": "Surf", "type": "Water", "power": 30}
        ]
    },
    {
        "name": "Venusaur",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png",
        "moves": [
            {"id": "v_m1", "name": "Solar Beam", "type": "Grass", "power": 45},
            {"id": "v_m2", "name": "Sludge Bomb", "type": "Poison", "power": 30},
            {"id": "v_m3", "name": "Giga Drain", "type": "Grass", "power": 20},
            {"id": "v_m4", "name": "Earthquake", "type": "Ground", "power": 35}
        ]
    },
    {
        "name": "Gengar",
        "hp": 120,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
        "moves": [
            {"id": "g_m1", "name": "Shadow Ball", "type": "Ghost", "power": 35},
            {"id": "g_m2", "name": "Sludge Wave", "type": "Poison", "power": 30},
            {"id": "g_m3", "name": "Dark Pulse", "type": "Dark", "power": 25},
            {"id": "g_m4", "name": "Thunderbolt", "type": "Electric", "power": 25}
        ]
    },
    {
        "name": "Lucario",
        "hp": 130,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png",
        "moves": [
            {"id": "l_m1", "name": "Aura Sphere", "type": "Fighting", "power": 35},
            {"id": "l_m2", "name": "Extreme Speed", "type": "Normal", "power": 25},
            {"id": "l_m3", "name": "Close Combat", "type": "Fighting", "power": 45},
            {"id": "l_m4", "name": "Flash Cannon", "type": "Steel", "power": 25}
        ]
    },
    {
        "name": "Mewtwo",
        "hp": 150,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        "moves": [
            {"id": "m_m1", "name": "Psystrike", "type": "Psychic", "power": 45},
            {"id": "m_m2", "name": "Shadow Ball", "type": "Ghost", "power": 30},
            {"id": "m_m3", "name": "Aura Sphere", "type": "Fighting", "power": 25},
            {"id": "m_m4", "name": "Ice Beam", "type": "Ice", "power": 25}
        ]
    },
    {
        "name": "Garchomp",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png",
        "moves": [
            {"id": "gc_m1", "name": "Earthquake", "type": "Ground", "power": 35},
            {"id": "gc_m2", "name": "Dragon Claw", "type": "Dragon", "power": 25},
            {"id": "gc_m3", "name": "Stone Edge", "type": "Rock", "power": 30},
            {"id": "gc_m4", "name": "Outrage", "type": "Dragon", "power": 45}
        ]
    },
    {
        "name": "Greninja",
        "hp": 125,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png",
        "moves": [
            {"id": "gr_m1", "name": "Water Shuriken", "type": "Water", "power": 30},
            {"id": "gr_m2", "name": "Night Slash", "type": "Dark", "power": 25},
            {"id": "gr_m3", "name": "Ice Beam", "type": "Ice", "power": 25},
            {"id": "gr_m4", "name": "Hydro Cannon", "type": "Water", "power": 45}
        ]
    },
    {
        "name": "Dragonite",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
        "moves": [
            {"id": "d_m1", "name": "Outrage", "type": "Dragon", "power": 40},
            {"id": "d_m2", "name": "Hurricane", "type": "Flying", "power": 35},
            {"id": "d_m3", "name": "Fire Punch", "type": "Fire", "power": 20},
            {"id": "d_m4", "name": "Extreme Speed", "type": "Normal", "power": 25}
        ]
    },
    {
        "name": "Blaziken",
        "hp": 135,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/257.png",
        "moves": [
            {"id": "bz_m1", "name": "Blaze Kick", "type": "Fire", "power": 30},
            {"id": "bz_m2", "name": "Sky Uppercut", "type": "Fighting", "power": 25},
            {"id": "bz_m3", "name": "Flare Blitz", "type": "Fire", "power": 45},
            {"id": "bz_m4", "name": "Brave Bird", "type": "Flying", "power": 35}
        ]
    },
    {
        "name": "Sceptile",
        "hp": 130,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/254.png",
        "moves": [
            {"id": "sc_m1", "name": "Leaf Blade", "type": "Grass", "power": 30},
            {"id": "sc_m2", "name": "Dragon Claw", "type": "Dragon", "power": 25},
            {"id": "sc_m3", "name": "Giga Drain", "type": "Grass", "power": 20},
            {"id": "sc_m4", "name": "Aerial Ace", "type": "Flying", "power": 20}
        ]
    },
    {
        "name": "Swampert",
        "hp": 150,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/260.png",
        "moves": [
            {"id": "sw_m1", "name": "Hydro Pump", "type": "Water", "power": 40},
            {"id": "sw_m2", "name": "Earthquake", "type": "Ground", "power": 35},
            {"id": "sw_m3", "name": "Ice Punch", "type": "Ice", "power": 20},
            {"id": "sw_m4", "name": "Muddy Water", "type": "Water", "power": 25}
        ]
    },
    {
        "name": "Metagross",
        "hp": 150,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png",
        "moves": [
            {"id": "mg_m1", "name": "Meteor Mash", "type": "Steel", "power": 35},
            {"id": "mg_m2", "name": "Zen Headbutt", "type": "Psychic", "power": 25},
            {"id": "mg_m3", "name": "Earthquake", "type": "Ground", "power": 30},
            {"id": "mg_m4", "name": "Hammer Arm", "type": "Fighting", "power": 30}
        ]
    },
    {
        "name": "Salamence",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/373.png",
        "moves": [
            {"id": "sal_m1", "name": "Dragon Claw", "type": "Dragon", "power": 30},
            {"id": "sal_m2", "name": "Hydro Pump", "type": "Water", "power": 40},
            {"id": "sal_m3", "name": "Fire Blast", "type": "Fire", "power": 35},
            {"id": "sal_m4", "name": "Dragon Dance", "type": "Dragon", "power": 15}
        ]
    },
    {
        "name": "Tyranitar",
        "hp": 150,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png",
        "moves": [
            {"id": "ty_m1", "name": "Crunch", "type": "Dark", "power": 30},
            {"id": "ty_m2", "name": "Rock Slide", "type": "Rock", "power": 30},
            {"id": "ty_m3", "name": "Earthquake", "type": "Ground", "power": 35},
            {"id": "ty_m4", "name": "Stone Edge", "type": "Rock", "power": 40}
        ]
    },
    {
        "name": "Umbreon",
        "hp": 135,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png",
        "moves": [
            {"id": "um_m1", "name": "Dark Pulse", "type": "Dark", "power": 30},
            {"id": "um_m2", "name": "Foul Play", "type": "Dark", "power": 25},
            {"id": "um_m3", "name": "Toxic", "type": "Poison", "power": 10},
            {"id": "um_m4", "name": "Iron Tail", "type": "Steel", "power": 25}
        ]
    },
    {
        "name": "Espeon",
        "hp": 120,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/196.png",
        "moves": [
            {"id": "es_m1", "name": "Psychic", "type": "Psychic", "power": 30},
            {"id": "es_m2", "name": "Shadow Ball", "type": "Ghost", "power": 25},
            {"id": "es_m3", "name": "Dazzling Gleam", "type": "Fairy", "power": 25},
            {"id": "es_m4", "name": "Morning Sun", "type": "Normal", "power": 10}
        ]
    },
    {
        "name": "Alakazam",
        "hp": 110,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png",
        "moves": [
            {"id": "al_m1", "name": "Psychic", "type": "Psychic", "power": 35},
            {"id": "al_m2", "name": "Focus Blast", "type": "Fighting", "power": 30},
            {"id": "al_m3", "name": "Shadow Ball", "type": "Ghost", "power": 25},
            {"id": "al_m4", "name": "Dazzling Gleam", "type": "Fairy", "power": 25}
        ]
    },
    {
        "name": "Machamp",
        "hp": 140,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/68.png",
        "moves": [
            {"id": "mc_m1", "name": "Close Combat", "type": "Fighting", "power": 40},
            {"id": "mc_m2", "name": "Rock Slide", "type": "Rock", "power": 25},
            {"id": "mc_m3", "name": "Stone Edge", "type": "Rock", "power": 35},
            {"id": "mc_m4", "name": "Payback", "type": "Dark", "power": 20}
        ]
    },
    {
        "name": "Gyarados",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
        "moves": [
            {"id": "gy_m1", "name": "Waterfall", "type": "Water", "power": 30},
            {"id": "gy_m2", "name": "Earthquake", "type": "Ground", "power": 30},
            {"id": "gy_m3", "name": "Ice Fang", "type": "Ice", "power": 25},
            {"id": "gy_m4", "name": "Dragon Dance", "type": "Dragon", "power": 15}
        ]
    },
    {
        "name": "Rayquaza",
        "hp": 155,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png",
        "moves": [
            {"id": "ray_m1", "name": "Dragon Ascent", "type": "Flying", "power": 45},
            {"id": "ray_m2", "name": "Extreme Speed", "type": "Normal", "power": 25},
            {"id": "ray_m3", "name": "Dragon Claw", "type": "Dragon", "power": 30},
            {"id": "ray_m4", "name": "Fire Blast", "type": "Fire", "power": 35}
        ]
    },
    {
        "name": "Milotic",
        "hp": 140,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/350.png",
        "moves": [
            {"id": "mi_m1", "name": "Hydro Pump", "type": "Water", "power": 40},
            {"id": "mi_m2", "name": "Ice Beam", "type": "Ice", "power": 25},
            {"id": "mi_m3", "name": "Dazzling Gleam", "type": "Fairy", "power": 25},
            {"id": "mi_m4", "name": "Recover", "type": "Normal", "power": 10}
        ]
    },
    {
        "name": "Infernape",
        "hp": 130,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/392.png",
        "moves": [
            {"id": "inf_m1", "name": "Flare Blitz", "type": "Fire", "power": 40},
            {"id": "inf_m2", "name": "Close Combat", "type": "Fighting", "power": 35},
            {"id": "inf_m3", "name": "Mach Punch", "type": "Fighting", "power": 15},
            {"id": "inf_m4", "name": "Flamethrower", "type": "Fire", "power": 30}
        ]
    },
    {
        "name": "Empoleon",
        "hp": 140,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/395.png",
        "moves": [
            {"id": "emp_m1", "name": "Hydro Pump", "type": "Water", "power": 40},
            {"id": "emp_m2", "name": "Flash Cannon", "type": "Steel", "power": 25},
            {"id": "emp_m3", "name": "Ice Beam", "type": "Ice", "power": 25},
            {"id": "emp_m4", "name": "Drill Peck", "type": "Flying", "power": 20}
        ]
    },
    {
        "name": "Torterra",
        "hp": 150,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/389.png",
        "moves": [
            {"id": "tor_m1", "name": "Earthquake", "type": "Ground", "power": 35},
            {"id": "tor_m2", "name": "Wood Hammer", "type": "Grass", "power": 40},
            {"id": "tor_m3", "name": "Stone Edge", "type": "Rock", "power": 30},
            {"id": "tor_m4", "name": "Crunch", "type": "Dark", "power": 25}
        ]
    },
    {
        "name": "Gardevoir",
        "hp": 125,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png",
        "moves": [
            {"id": "gar_m1", "name": "Moonblast", "type": "Fairy", "power": 30},
            {"id": "gar_m2", "name": "Psychic", "type": "Psychic", "power": 30},
            {"id": "gar_m3", "name": "Shadow Ball", "type": "Ghost", "power": 25},
            {"id": "gar_m4", "name": "Thunderbolt", "type": "Electric", "power": 20}
        ]
    },
    {
        "name": "Scizor",
        "hp": 135,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/212.png",
        "moves": [
            {"id": "sci_m1", "name": "Bullet Punch", "type": "Steel", "power": 15},
            {"id": "sci_m2", "name": "X-Scissor", "type": "Bug", "power": 30},
            {"id": "sci_m3", "name": "Iron Head", "type": "Steel", "power": 30},
            {"id": "sci_m4", "name": "Superpower", "type": "Fighting", "power": 35}
        ]
    },
    {
        "name": "Heatran",
        "hp": 145,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/485.png",
        "moves": [
            {"id": "heat_m1", "name": "Magma Storm", "type": "Fire", "power": 35},
            {"id": "heat_m2", "name": "Flash Cannon", "type": "Steel", "power": 25},
            {"id": "heat_m3", "name": "Earth Power", "type": "Ground", "power": 30},
            {"id": "heat_m4", "name": "Flamethrower", "type": "Fire", "power": 30}
        ]
    },
    {
        "name": "Darkrai",
        "hp": 140,
        "sprite_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/491.png",
        "moves": [
            {"id": "dk_m1", "name": "Dark Pulse", "type": "Dark", "power": 35},
            {"id": "dk_m2", "name": "Nasty Plot", "type": "Dark", "power": 15},
            {"id": "dk_m3", "name": "Ice Beam", "type": "Ice", "power": 25},
            {"id": "dk_m4", "name": "Sludge Bomb", "type": "Poison", "power": 25}
        ]
    }
]

_FALLBACK_STATS = {
    "attack": _calc_level50_stat(80),
    "defense": _calc_level50_stat(80),
    "special-attack": _calc_level50_stat(80),
    "special-defense": _calc_level50_stat(80),
    "speed": _calc_level50_stat(80),
}

# Rough typing for the curated fallback roster, used only when PokeAPI is
# unreachable - good enough for STAB/effectiveness on a rarely-hit path.
_FALLBACK_TYPES = {
    "Pikachu": ["Electric"], "Charizard": ["Fire", "Flying"], "Blastoise": ["Water"],
    "Venusaur": ["Grass", "Poison"], "Gengar": ["Ghost", "Poison"], "Lucario": ["Fighting", "Steel"],
    "Mewtwo": ["Psychic"], "Garchomp": ["Dragon", "Ground"], "Greninja": ["Water", "Dark"],
    "Dragonite": ["Dragon", "Flying"], "Blaziken": ["Fire", "Fighting"], "Sceptile": ["Grass"],
    "Swampert": ["Water", "Ground"], "Metagross": ["Steel", "Psychic"], "Salamence": ["Dragon", "Flying"],
    "Tyranitar": ["Rock", "Dark"], "Umbreon": ["Dark"], "Espeon": ["Psychic"], "Alakazam": ["Psychic"],
    "Machamp": ["Fighting"], "Gyarados": ["Water", "Flying"], "Rayquaza": ["Dragon", "Flying"],
    "Milotic": ["Water"], "Infernape": ["Fire", "Fighting"], "Empoleon": ["Water", "Steel"],
    "Torterra": ["Grass", "Ground"], "Gardevoir": ["Psychic", "Fairy"], "Scizor": ["Bug", "Steel"],
    "Heatran": ["Fire", "Steel"], "Darkrai": ["Dark"],
}


def generate_random_battle_pokemon(user_id: str) -> dict:
    """Randomly selects a Pokémon from the pool and assigns the user ID."""
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


# --- DYNAMIC ROSTER: ALL 1025 POKÉMON VIA POKEAPI ---
# Hand-curating movesets for all 1025 species isn't practical to maintain, so
# battles instead pull a random species (and a real, damaging moveset) live
# from PokeAPI - the same data source already used for the quiz modules.
# Results are cached in-process so repeat picks (very likely once a few
# hundred battles have run) don't re-hit the network. POKEMON_BATTLE_POOL
# above is kept as a fallback if PokeAPI is slow/unreachable, so a flaky
# request never blocks someone from getting into a match.

POKEMON_API_CACHE: Dict[int, dict] = {}
MOVE_API_CACHE: Dict[str, dict] = {}


def _fetch_pokemon_base(pokemon_id: int) -> Optional[dict]:
    """Fetches (and caches) a species' name, real level-50 stats, types,
    artwork, and move name list."""
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
    """Fetches (and caches) a move's display name, type, real power, and
    physical/special damage class. Returns None for status/non-damaging
    moves (no power value) - the caller skips these since this battle
    engine only deals direct damage."""
    cached = MOVE_API_CACHE.get(move_name)
    if cached is not None:
        return cached if cached else None
    try:
        res = requests.get(f"https://pokeapi.co/api/v2/move/{move_name}", timeout=5).json()
        power = res.get("power")
        if not power:
            MOVE_API_CACHE[move_name] = {}  # cache the "no power" result too
            return None
        move_type = res["type"]["name"].capitalize()
        display_name = res["name"].replace("-", " ").title()
        damage_class = (res.get("damage_class") or {}).get("name", "physical")
        # Real power is used directly now - the actual damage formula
        # (level, stats, STAB, type effectiveness) handles scaling, so no
        # artificial rescale is needed like before.
        data = {"name": display_name, "type": move_type, "power": int(power), "damage_class": damage_class}
        MOVE_API_CACHE[move_name] = data
        return data
    except Exception as e:
        print(f"[Battle Roster] Failed to fetch move {move_name}: {e}")
        return None


def _build_battle_pokemon_from_api(user_id: str) -> Optional[dict]:
    """Attempts to build a battler from a random live PokeAPI species. Returns
    None (triggering the static fallback) if the species can't be fetched or
    doesn't yield at least 4 usable damaging moves within a bounded search."""
    pokemon_id = random.randint(1, 1025)
    base = _fetch_pokemon_base(pokemon_id)
    if not base or not base["move_pool"]:
        return None

    candidates = base["move_pool"][:]
    random.shuffle(candidates)

    chosen_moves = []
    # Bounded scan: enough to find 4 damaging moves for the vast majority of
    # species without risking a very long chain of requests on a first-ever
    # (uncached) pick of a Pokémon with an unusually move-list.
    for mv_name in candidates[:30]:
        if len(chosen_moves) >= 4:
            break
        detail = _fetch_move_detail(mv_name)
        if detail:
            chosen_moves.append(detail)

    if len(chosen_moves) < 4:
        return None

    for idx, mv in enumerate(chosen_moves):
        mv["id"] = f"api_{pokemon_id}_{idx}"

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
    """Preferred entry point: tries the full 1025-species live roster first,
    falling back to the curated 30-species static pool on any failure so a
    PokeAPI hiccup never blocks matchmaking."""
    try:
        result = _build_battle_pokemon_from_api(user_id)
        if result:
            return result
    except Exception as e:
        print(f"[Battle Roster] Live roster generation failed, using fallback pool: {e}")
    return generate_random_battle_pokemon(user_id)


async def generate_random_battle_pokemon_async(user_id: str) -> dict:
    """Runs the (blocking, requests-based) roster generation off the event
    loop thread, since match creation happens inside async websocket
    handlers and must not stall every other connected player's socket while
    PokeAPI responds."""
    return await asyncio.to_thread(generate_random_battle_pokemon_any, user_id)


# --- TEAM BUILDER: SEARCH + SPECIES DETAIL ---
# Backs the pre-battle "pick your own Pokémon and moves" screen. Search is
# a simple substring match over a one-time cached list of all species
# names; the detail endpoint reuses the same base/move fetch+cache helpers
# as the random-roster generator above.

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

    move_options = []
    for mv_name in candidates[:40]:
        if len(move_options) >= 20:
            break
        detail = _fetch_move_detail(mv_name)
        if detail:
            move_options.append({**detail, "move_key": mv_name})

    return {
        "id": pokemon_id,
        "name": base["name"],
        "hp": base["hp"],
        "sprite_url": base["sprite_url"],
        "moves": move_options,
    }


def _build_battle_pokemon_from_selection(user_id: str, selection: Optional[dict]) -> dict:
    """Builds a battler from a player's pre-battle team-builder pick,
    re-validating everything server-side against PokeAPI/cache data so a
    tampered client payload can't inject fake move power or an out-of-range
    species - only the pokemon_id and move_key names are trusted from the
    client; every stat and move detail is re-derived from cached API data.
    Falls back to the existing random generator if no selection was
    provided, or if it fails validation entirely (e.g. bad species id)."""
    if not selection:
        return generate_random_battle_pokemon_any(user_id)

    try:
        pokemon_id = int(selection.get("pokemon_id"))
    except (TypeError, ValueError):
        return generate_random_battle_pokemon_any(user_id)

    if not (1 <= pokemon_id <= 1025):
        return generate_random_battle_pokemon_any(user_id)

    base = _fetch_pokemon_base(pokemon_id)
    if not base:
        return generate_random_battle_pokemon_any(user_id)

    requested_moves = selection.get("moves") or []
    valid_move_pool = set(base["move_pool"])

    chosen_moves = []
    for mv_key in requested_moves:
        if len(chosen_moves) >= 4:
            break
        if mv_key not in valid_move_pool:
            continue  # reject anything not actually in this species' real movepool
        detail = _fetch_move_detail(mv_key)
        if detail:
            chosen_moves.append(dict(detail))

    # Pad up to 4 with other real damaging moves from the same species if
    # the player picked fewer than 4 valid ones, so a battle never starts
    # with an empty moveset.
    if len(chosen_moves) < 4:
        backfill_candidates = [m for m in base["move_pool"] if m not in requested_moves]
        random.shuffle(backfill_candidates)
        for mv_key in backfill_candidates:
            if len(chosen_moves) >= 4:
                break
            detail = _fetch_move_detail(mv_key)
            if detail:
                chosen_moves.append(dict(detail))

    if not chosen_moves:
        return generate_random_battle_pokemon_any(user_id)

    for idx, mv in enumerate(chosen_moves):
        mv["id"] = f"sel_{pokemon_id}_{idx}"

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


async def build_battle_pokemon_from_selection_async(user_id: str, selection: Optional[dict]) -> dict:
    return await asyncio.to_thread(_build_battle_pokemon_from_selection, user_id, selection)


class BattleRoom:
    """
    status lifecycle:
      "ongoing"   -> turns being played
      "finished"  -> someone fainted; rematch-eligible via handle_rematch
      "abandoned" -> someone explicitly exited or disconnected; terminal,
                     NOT rematch-eligible (there's no one left to agree)
    """

    def __init__(self, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket,
                 p1_pokemon: dict, p2_pokemon: dict,
                 p1_selection: Optional[dict] = None, p2_selection: Optional[dict] = None):
        self.room_id = room_id

        # Player 1 Setup
        self.p1_id = p1_id
        self.p1_ws = p1_ws
        self.p1_pokemon = p1_pokemon
        self.p1_selection = p1_selection  # remembered so rematches reuse the same picked team

        # Player 2 Setup
        self.p2_id = p2_id
        self.p2_ws = p2_ws
        self.p2_pokemon = p2_pokemon
        self.p2_selection = p2_selection

        self.turn = 1
        self.pending_actions: Dict[str, str] = {}
        self.rematch_votes: Set[str] = set()
        self.status = "ongoing"
        self.winner = None

    @classmethod
    async def create(cls, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket,
                      p1_selection: Optional[dict] = None, p2_selection: Optional[dict] = None) -> "BattleRoom":
        """Async factory: builds both battlers (each may involve a live
        PokeAPI fetch) before constructing the room, since __init__ can't
        itself be async. If a player pre-built their team via the team
        builder, that exact Pokémon/moveset is used (server-validated);
        otherwise falls back to a random pick. Re-rolls player 2's random
        pick a few times if it happens to match player 1's species - but
        never overrides a deliberate, explicit selection."""
        p1_pokemon = await build_battle_pokemon_from_selection_async(p1_id, p1_selection)
        p2_pokemon = await build_battle_pokemon_from_selection_async(p2_id, p2_selection)

        attempts = 0
        while p2_pokemon["name"] == p1_pokemon["name"] and attempts < 5:
            if p2_selection:
                break  # respect a deliberate pick even if it matches p1's species
            p2_pokemon = await generate_random_battle_pokemon_async(p2_id)
            attempts += 1

        return cls(room_id, p1_id, p1_ws, p2_id, p2_ws, p1_pokemon, p2_pokemon, p1_selection, p2_selection)

    def rebind_socket(self, user_id: str, websocket: WebSocket) -> None:
        """Points this player's slot at a fresh socket (e.g. after a page
        reload) so they keep receiving updates for a battle already in
        progress instead of being silently stranded."""
        if user_id == self.p1_id:
            self.p1_ws = websocket
        elif user_id == self.p2_id:
            self.p2_ws = websocket

    def get_state_for_player(self, user_id: str) -> dict:
        """Returns player-perspective state (your active Pokémon on bottom left)."""
        if user_id == self.p1_id:
            active = self.p1_pokemon
            opponent = self.p2_pokemon
        else:
            active = self.p2_pokemon
            opponent = self.p1_pokemon

        payload = {
            "type": "state_update",
            "state": {
                "turn": self.turn,
                "active_pokemon": active,
                "opponent_pokemon": opponent,
                "status": self.status,
                "rematch_requested_by_me": user_id in self.rematch_votes,
                "rematch_votes_count": len(self.rematch_votes)
            }
        }
        if self.winner:
            payload["state"]["winner"] = self.winner
        return payload

    async def broadcast_states(self):
        """Sends updated state perspectives to both connected players."""
        try:
            await self.p1_ws.send_json(self.get_state_for_player(self.p1_id))
            await self.p2_ws.send_json(self.get_state_for_player(self.p2_id))
        except Exception as e:
            print(f"[Room {self.room_id}] State broadcast error: {e}")

    async def broadcast_log(self, text: str):
        """Sends logs to both players."""
        log_msg = {"type": "log", "log": {"text": text, "timestamp": int(time.time() * 1000)}}
        try:
            await self.p1_ws.send_json(log_msg)
            await self.p2_ws.send_json(log_msg)
        except Exception as e:
            print(f"[Room {self.room_id}] Log broadcast error: {e}")

    async def broadcast_game_over(self):
        """Notifies both clients of game conclusion and win/loss status. The
        client is told exactly which two actions are on the table so the UI
        can render an unambiguous 'Rematch' / 'Exit' choice."""
        for uid, ws in [(self.p1_id, self.p1_ws), (self.p2_id, self.p2_ws)]:
            try:
                await ws.send_json({
                    "type": "game_over",
                    "winner": self.winner,
                    "available_actions": ["rematch", "exit"],
                    "state": self.get_state_for_player(uid)["state"]
                })
            except Exception as e:
                print(f"[Room {self.room_id}] Game Over broadcast error for {uid}: {e}")

    async def handle_action(self, user_id: str, move_id: str):
        if self.status != "ongoing" or user_id in self.pending_actions:
            return

        self.pending_actions[user_id] = move_id

        if len(self.pending_actions) < 2:
            target_ws = self.p1_ws if user_id == self.p1_id else self.p2_ws
            try:
                await target_ws.send_json({
                    "type": "log",
                    "log": {"text": "Move selected! Waiting for opposing trainer...", "timestamp": int(time.time() * 1000)}
                })
            except Exception as e:
                print(f"[Room {self.room_id}] Ack send error: {e}")
            return

        await self.resolve_turn()

    async def handle_rematch(self, user_id: str):
        """
        Rematch Agreement Protocol: only meaningful once a battle has
        concluded normally (status == "finished"). A room that ended
        because someone left ("abandoned") has no one left to agree with,
        so it's explicitly excluded here.
        """
        if self.status != "finished":
            return

        self.rematch_votes.add(user_id)

        if len(self.rematch_votes) == 1:
            other_ws = self.p2_ws if user_id == self.p1_id else self.p1_ws
            try:
                await other_ws.send_json({
                    "type": "rematch_status",
                    "text": "Opponent wants a rematch! Click Rematch to accept.",
                    "opponent_wants_rematch": True
                })
            except Exception as e:
                print(f"[Room {self.room_id}] Rematch notify error: {e}")
            await self.broadcast_log("Trainer requested a rematch!")
            await self.broadcast_states()

        elif len(self.rematch_votes) >= 2:
            # Synchronized Battle Restart: both trainers agreed. Reuse this
            # SAME room object (rather than routing back through the global
            # matchmaker) so a rematch can never accidentally pair either
            # player with a different opponent. Rebuild from each player's
            # ORIGINAL team-builder selection (if they made one) so a
            # deliberately-picked team persists across rematches instead of
            # being randomized away - HP simply resets to full via a fresh
            # build.
            self.p1_pokemon = await build_battle_pokemon_from_selection_async(self.p1_id, self.p1_selection)
            self.p2_pokemon = await build_battle_pokemon_from_selection_async(self.p2_id, self.p2_selection)

            attempts = 0
            while self.p2_pokemon["name"] == self.p1_pokemon["name"] and attempts < 5:
                if self.p2_selection:
                    break  # respect a deliberate pick even if it matches p1's species
                self.p2_pokemon = await generate_random_battle_pokemon_async(self.p2_id)
                attempts += 1

            self.turn = 1
            self.pending_actions.clear()
            self.rematch_votes.clear()
            self.status = "ongoing"
            self.winner = None

            await self.broadcast_log(f"Rematch accepted! {self.p1_pokemon['name']} vs {self.p2_pokemon['name']}!")
            await self.broadcast_states()

    async def handle_exit(self, user_id: str):
        """Exit & Opponent Left Handling: notifies the remaining player and
        marks the room terminal (no rematch possible from this state). If a
        rematch vote was already pending when this exit happens, the person
        who requested it gets a distinct 'rematch_declined' message rather
        than a generic 'opponent left', since the two situations read very
        differently to a player waiting on a response."""
        if self.status == "abandoned":
            return  # already handled

        other_id = self.p2_id if user_id == self.p1_id else self.p1_id
        other_ws = self.p2_ws if user_id == self.p1_id else self.p1_ws
        rematch_was_pending = self.status == "finished" and len(self.rematch_votes) > 0

        try:
            if rematch_was_pending and other_id in self.rematch_votes:
                await other_ws.send_json({
                    "type": "rematch_declined",
                    "text": "Opponent left instead of accepting the rematch."
                })
            else:
                await other_ws.send_json({
                    "type": "opponent_left",
                    "text": "Opponent left the battle."
                })
        except Exception as e:
            print(f"[Room {self.room_id}] Opponent-left notify error: {e}")

        self.rematch_votes.clear()
        self.status = "abandoned"

    async def resolve_turn(self):
        p1_move_id = self.pending_actions.get(self.p1_id)
        p2_move_id = self.pending_actions.get(self.p2_id)

        p1_move = next((m for m in self.p1_pokemon["moves"] if m["id"] == p1_move_id), self.p1_pokemon["moves"][0])
        p2_move = next((m for m in self.p2_pokemon["moves"] if m["id"] == p2_move_id), self.p2_pokemon["moves"][0])

        # Execute Player 1 Attack - real damage formula (stats, STAB, type
        # effectiveness, crit chance) instead of just subtracting raw power.
        await self.broadcast_log(f"{self.p1_pokemon['name']} used {p1_move['name']}!")
        p1_result = _calculate_move_damage(p1_move, self.p1_pokemon, self.p2_pokemon)
        p1_dmg = p1_result["damage"]

        if p1_result["effectiveness"] == 0.0:
            await self.broadcast_log(f"It had no effect on {self.p2_pokemon['name']}!")
        else:
            self.p2_pokemon["current_hp"] = max(0, self.p2_pokemon["current_hp"] - p1_dmg)
            if p1_result["critical"]:
                await self.broadcast_log("A critical hit!")
            if p1_result["effectiveness"] > 1.0:
                await self.broadcast_log("It's super effective!")
            elif p1_result["effectiveness"] < 1.0:
                await self.broadcast_log("It's not very effective...")
            await self.broadcast_log(f"{self.p2_pokemon['name']} took {p1_dmg} damage!")

        # Check if Player 2 Fainted
        if self.p2_pokemon["current_hp"] <= 0:
            self.status = "finished"
            self.winner = self.p1_pokemon["id"]
            await self.broadcast_log(f"{self.p2_pokemon['name']} fainted! Victory declared!")
            await self.broadcast_states()
            await self.broadcast_game_over()
            return

        # Execute Player 2 Attack
        await self.broadcast_log(f"{self.p2_pokemon['name']} used {p2_move['name']}!")
        p2_result = _calculate_move_damage(p2_move, self.p2_pokemon, self.p1_pokemon)
        p2_dmg = p2_result["damage"]

        if p2_result["effectiveness"] == 0.0:
            await self.broadcast_log(f"It had no effect on {self.p1_pokemon['name']}!")
        else:
            self.p1_pokemon["current_hp"] = max(0, self.p1_pokemon["current_hp"] - p2_dmg)
            if p2_result["critical"]:
                await self.broadcast_log("A critical hit!")
            if p2_result["effectiveness"] > 1.0:
                await self.broadcast_log("It's super effective!")
            elif p2_result["effectiveness"] < 1.0:
                await self.broadcast_log("It's not very effective...")
            await self.broadcast_log(f"{self.p1_pokemon['name']} took {p2_dmg} damage!")

        # Check if Player 1 Fainted
        if self.p1_pokemon["current_hp"] <= 0:
            self.status = "finished"
            self.winner = self.p2_pokemon["id"]
            await self.broadcast_log(f"{self.p1_pokemon['name']} fainted! Victory declared!")
            await self.broadcast_states()
            await self.broadcast_game_over()
            return

        # Next turn
        self.pending_actions.clear()
        self.turn += 1
        await self.broadcast_states()


class BattleMatchmaker:
    """
    Connecting a socket and *queueing for a match* are deliberately separate
    steps (register_connection vs join_queue). A raw socket connection —
    including reconnects that happen for reasons unrelated to matchmaking
    intent, like a remounted component or a network blip — must never by
    itself place a player into a new battle. Queueing only happens on an
    explicit "find_match" action, and even then a player already inside a
    live room is refused a second match.
    """

    def __init__(self):
        self.waiting_player: Optional[tuple[str, WebSocket, Optional[dict]]] = None
        self.active_rooms: Dict[str, BattleRoom] = {}
        self.active_connections: Dict[str, WebSocket] = {}

    async def register_connection(self, user_id: str, websocket: WebSocket):
        """Registers the socket without putting the user into the queue. If
        the player already has a live or rematch-pending room (e.g. they
        refreshed the page mid-battle), rebind that room to the new socket
        and push them the current state immediately."""
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

    async def join_queue(self, user_id: str, selection: Optional[dict] = None):
        """Explicitly adds player to queue or matches them with a waiting
        opponent. `selection` is the player's team-builder pick (species +
        moves), if they made one via the pre-battle picker; None falls back
        to a random battler for that player."""
        websocket = self.active_connections.get(user_id)
        if not websocket:
            return

        # Already in a live or rematch-pending room — refuse to spin up a
        # second, disconnected battle behind the client's back.
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

            # Collision-proof unique room ID
            room_id = f"arena_{uuid.uuid4().hex[:12]}"
            room = await BattleRoom.create(room_id, p1_id, p1_ws, user_id, websocket, p1_selection, selection)
            self.active_rooms[room_id] = room

            await room.broadcast_log(f"Match started! {room.p1_pokemon['name']} vs {room.p2_pokemon['name']}!")
            await room.broadcast_states()
            print(f"[Matchmaker] New room initialized: {room_id}")
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
        """Removes trainer from waiting queue if present."""
        if self.waiting_player and self.waiting_player[0] == user_id:
            self.waiting_player = None
            print(f"[Matchmaker] Trainer {user_id} removed from queue.")

    def find_room(self, user_id: str) -> Optional[BattleRoom]:
        """Finds an active (non-abandoned) room associated with user_id."""
        for room in list(self.active_rooms.values()):
            if user_id in (room.p1_id, room.p2_id) and room.status != "abandoned":
                return room
        return None

    def remove_room(self, room_id: str):
        """Completely purges room from active list."""
        if room_id in self.active_rooms:
            del self.active_rooms[room_id]
            print(f"[Matchmaker] Room {room_id} cleaned up.")

    async def disconnect(self, user_id: str):
        """
        Handles a raw socket disconnect. Deliberately does NOT treat this the
        same as an explicit "exit" action: a socket can drop for reasons that
        have nothing to do with the player actually leaving — most commonly,
        the frontend component that owns the websocket unmounting during a
        screen transition (e.g. moving from the battle view to a results
        overlay) right after the match ends. If we immediately abandoned the
        room here, the very next "find_match" from a freshly reconnected
        socket would slip past find_room's guard (the room would already be
        gone) and pair the same two players into a brand new match — which
        is exactly the "instantly starts a new fight" bug. Instead we give a
        short grace window for the player to reconnect before finalizing the
        disconnect as a genuine exit.
        """
        self.leave_queue(user_id)

        if self.active_connections.get(user_id):
            del self.active_connections[user_id]

        room = self.find_room(user_id)
        if not room:
            return

        asyncio.create_task(self._finalize_disconnect(user_id, room.room_id))

    async def _finalize_disconnect(self, user_id: str, room_id: str, grace_seconds: float = 45.0) -> None:
        await asyncio.sleep(grace_seconds)

        # Reconnected within the grace window (register_connection re-adds
        # them to active_connections) — nothing to do, the room stays intact
        # and they can still choose Rematch or Exit normally.
        if user_id in self.active_connections:
            return

        room = self.active_rooms.get(room_id)
        if not room:
            return

        await room.handle_exit(user_id)
        self.remove_room(room_id)


matchmaker = BattleMatchmaker()

# --- ALIAS ROUTE FOR FRONTEND COMPATIBILITY ---
@app.websocket("/ws")
async def alias_battle_websocket_endpoint(websocket: WebSocket, token: str = "guest"):
    """Alias route to catch connections hitting /ws instead of /api/battle/ws"""
    await battle_websocket_endpoint(websocket, token)

# --- BATTLE ARENA WEBSOCKET ROUTE ---
@app.websocket("/api/battle/ws")
async def battle_websocket_endpoint(websocket: WebSocket, token: str = "guest"):
    user_id = token
    await matchmaker.register_connection(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            
            # FIX 1: Prevent JSON crashes
            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                print(f"[Battle Arena] Received invalid JSON from {user_id}")
                continue
                
            action = parsed.get("action")

            try:
                if action == "find_match":
                    selection = parsed.get("selection")  # {"pokemon_id": int, "moves": [move_key, ...]}
                    await matchmaker.join_queue(user_id, selection)
                elif action == "cancel_search":
                    matchmaker.leave_queue(user_id)
                elif action == "ping":
                    # FIX 2: Defeat the Render timeout (Do nothing, just acknowledge)
                    pass
                else:
                    room = matchmaker.find_room(user_id)
                    if room:
                        if action == "use_move":
                            move_id = parsed.get("moveId")
                            await room.handle_action(user_id, move_id)
                        elif action == "rematch":
                            await room.handle_rematch(user_id)
                        elif action == "exit":
                            await room.handle_exit(user_id)
                            matchmaker.remove_room(room.room_id)
            except Exception as e:
                # A bug in one turn's resolution (e.g. the damage formula
                # hitting unexpected data) must NEVER crash the raw websocket
                # loop - that would silently disconnect BOTH players in the
                # room, which is exactly the "multiplayer keeps disconnecting"
                # symptom this is guarding against. Log the full traceback
                # server-side so the real cause is visible in Render logs,
                # and keep the connection alive either way.
                import traceback
                print(f"[Battle Arena] Error handling action '{action}' for {user_id}: {e}")
                traceback.print_exc()

    except WebSocketDisconnect:
        await matchmaker.disconnect(user_id)
        print(f"[Battle Arena] Trainer {user_id} disconnected.")