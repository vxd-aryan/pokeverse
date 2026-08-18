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

@app.post("/api/auth/register", response_model=schemas.UserResponse)
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
    return new_user

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


class BattleRoom:
    """
    status lifecycle:
      "ongoing"   -> turns being played
      "finished"  -> someone fainted; rematch-eligible via handle_rematch
      "abandoned" -> someone explicitly exited or disconnected; terminal,
                     NOT rematch-eligible (there's no one left to agree)
    """

    def __init__(self, room_id: str, p1_id: str, p1_ws: WebSocket, p2_id: str, p2_ws: WebSocket):
        self.room_id = room_id

        # Player 1 Setup
        self.p1_id = p1_id
        self.p1_ws = p1_ws
        self.p1_pokemon = generate_random_battle_pokemon(p1_id)

        # Player 2 Setup
        self.p2_id = p2_id
        self.p2_ws = p2_ws
        self.p2_pokemon = generate_random_battle_pokemon(p2_id)

        if self.p2_pokemon["name"] == self.p1_pokemon["name"]:
            self.p2_pokemon = generate_random_battle_pokemon(p2_id)

        self.turn = 1
        self.pending_actions: Dict[str, str] = {}
        self.rematch_votes: Set[str] = set()
        self.status = "ongoing"
        self.winner = None

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
            self.p1_pokemon = generate_random_battle_pokemon(self.p1_id)
            self.p2_pokemon = generate_random_battle_pokemon(self.p2_id)

            if self.p2_pokemon["name"] == self.p1_pokemon["name"]:
                self.p2_pokemon = generate_random_battle_pokemon(self.p2_id)

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
            room = BattleRoom(room_id, p1_id, p1_ws, user_id, websocket)
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

    async def _finalize_disconnect(self, user_id: str, room_id: str, grace_seconds: float = 20.0) -> None:
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