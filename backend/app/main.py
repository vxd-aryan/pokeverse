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

def generate_random_battle_pokemon(user_id: str) -> dict:
    """Randomly selects a Pokémon from the pool and assigns the user ID."""
    template = random.choice(POKEMON_BATTLE_POOL)
    return {
        "id": user_id,
        "name": template["name"],
        "current_hp": template["hp"],
        "max_hp": template["hp"],
        "sprite_url": template["sprite_url"],
        "moves": [dict(m) for m in template["moves"]]
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
    """Fetches (and caches) a species' name, HP, artwork, and move name list."""
    cached = POKEMON_API_CACHE.get(pokemon_id)
    if cached:
        return cached
    try:
        res = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}", timeout=5).json()
        name = res["name"].replace("-", " ").title()
        hp_stat = next((s["base_stat"] for s in res["stats"] if s["stat"]["name"] == "hp"), 100)
        # Scale base HP stat into the game's existing 90-160 battle-HP range
        # so older/newer generations' differing stat scales still feel fair
        # against each other and against the curated fallback roster.
        hp = int(max(90, min(160, hp_stat * 1.4)))
        sprite = (
            res["sprites"]["other"]["official-artwork"]["front_default"]
            or res["sprites"]["front_default"]
        )
        move_names = [m["move"]["name"] for m in res["moves"]]
        data = {"name": name, "hp": hp, "sprite_url": sprite or "", "move_pool": move_names}
        POKEMON_API_CACHE[pokemon_id] = data
        return data
    except Exception as e:
        print(f"[Battle Roster] Failed to fetch pokemon {pokemon_id}: {e}")
        return None


def _fetch_move_detail(move_name: str) -> Optional[dict]:
    """Fetches (and caches) a move's display name, type, and power. Returns
    None for status/non-damaging moves (no power value) - the caller skips
    these since this battle engine only deals direct damage."""
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
        # Rescale PokeAPI's raw power (roughly 40-150) into this game's
        # existing 15-45 damage range so battles stay a similar length
        # whether a Pokémon came from the curated list or the live API.
        scaled_power = int(max(15, min(45, power // 3)))
        data = {"name": display_name, "type": move_type, "power": scaled_power}
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


class BattleRoom:
    """
    status lifecycle:
      "ongoing"   -> turns being played
      "finished"  -> someone fainted; rematch-eligible via handle_rematch
      "abandoned" -> someone explicitly exited or disconnected; terminal,
                     NOT rematch-eligible (there's no one left to agree)
    """

    def __init__(self, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket,
                 p1_pokemon: dict, p2_pokemon: dict):
        self.room_id = room_id

        # Player 1 Setup
        self.p1_id = p1_id
        self.p1_ws = p1_ws
        self.p1_pokemon = p1_pokemon

        # Player 2 Setup
        self.p2_id = p2_id
        self.p2_ws = p2_ws
        self.p2_pokemon = p2_pokemon

        self.turn = 1
        self.pending_actions: Dict[str, str] = {}
        self.rematch_votes: Set[str] = set()
        self.status = "ongoing"
        self.winner = None

    @classmethod
    async def create(cls, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket) -> "BattleRoom":
        """Async factory: builds both battlers (each may involve a live
        PokeAPI fetch) before constructing the room, since __init__ can't
        itself be async. Re-rolls player 2 a few times if they happen to
        land on the same species as player 1."""
        p1_pokemon = await generate_random_battle_pokemon_async(p1_id)
        p2_pokemon = await generate_random_battle_pokemon_async(p2_id)

        attempts = 0
        while p2_pokemon["name"] == p1_pokemon["name"] and attempts < 5:
            p2_pokemon = await generate_random_battle_pokemon_async(p2_id)
            attempts += 1

        return cls(room_id, p1_id, p1_ws, p2_id, p2_ws, p1_pokemon, p2_pokemon)

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
            # player with a different opponent.
            self.p1_pokemon = await generate_random_battle_pokemon_async(self.p1_id)
            self.p2_pokemon = await generate_random_battle_pokemon_async(self.p2_id)

            attempts = 0
            while self.p2_pokemon["name"] == self.p1_pokemon["name"] and attempts < 5:
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

        # Execute Player 1 Attack
        p1_dmg = p1_move["power"]
        self.p2_pokemon["current_hp"] = max(0, self.p2_pokemon["current_hp"] - p1_dmg)
        await self.broadcast_log(f"{self.p1_pokemon['name']} used {p1_move['name']}! Dealt {p1_dmg} damage!")

        # Check if Player 2 Fainted
        if self.p2_pokemon["current_hp"] <= 0:
            self.status = "finished"
            self.winner = self.p1_pokemon["id"]
            await self.broadcast_log(f"{self.p2_pokemon['name']} fainted! Victory declared!")
            await self.broadcast_states()
            await self.broadcast_game_over()
            return

        # Execute Player 2 Attack
        p2_dmg = p2_move["power"]
        self.p1_pokemon["current_hp"] = max(0, self.p1_pokemon["current_hp"] - p2_dmg)
        await self.broadcast_log(f"{self.p2_pokemon['name']} used {p2_move['name']}! Dealt {p2_dmg} damage!")

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
        self.waiting_player: Optional[tuple[str, WebSocket]] = None
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

    async def join_queue(self, user_id: str):
        """Explicitly adds player to queue or matches them with a waiting opponent."""
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
            p1_id, p1_ws = self.waiting_player
            self.waiting_player = None

            # Collision-proof unique room ID
            room_id = f"arena_{uuid.uuid4().hex[:12]}"
            room = await BattleRoom.create(room_id, p1_id, p1_ws, user_id, websocket)
            self.active_rooms[room_id] = room

            await room.broadcast_log(f"Match started! {room.p1_pokemon['name']} vs {room.p2_pokemon['name']}!")
            await room.broadcast_states()
            print(f"[Matchmaker] New room initialized: {room_id}")
        else:
            self.waiting_player = (user_id, websocket)
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

            if action == "find_match":
                await matchmaker.join_queue(user_id)
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

    except WebSocketDisconnect:
        await matchmaker.disconnect(user_id)
        print(f"[Battle Arena] Trainer {user_id} disconnected.")