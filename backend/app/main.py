from fastapi import FastAPI, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import requests
import random
import os  # Added to read system environment variables

# Import database connection components and architectural schemas
from database import get_db, engine
import models
import schemas
import crud

# Automatically generate database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PokéVerse Academy Sync Matrix")

# Dynamically read allowed frontend origins from environment variables.
# Defaults to localhost for your local development environment.
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
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
    
    # If we already generated today's questions, return them.
    if DAILY_CACHE["date"] == today_str and DAILY_CACHE["questions"]:
        return DAILY_CACHE["questions"]

    # Seed the random number generator so all servers/restarts on this day get the same IDs
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
                # Type Question
                types = [t["type"]["name"].capitalize() for t in res["types"]]
                correct = " / ".join(types)
                q_text = f"What is the exact typing of {name}?"
                options = [correct]
                while len(options) < 4:
                    wrong = rng.choice(["Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"])
                    if wrong not in options: options.append(wrong)
            else:
                # Identification Question
                q_text = f"Identify this Pokémon."
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
                "is_silhouette": (i % 2 == 0) # Make half of them silhouettes
            })
        except Exception:
            continue # Skip if API fails on a specific ID

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
    """Fetches the top 50 trainers ranked primarily by Level, then by XP."""
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
    """Returns today's 10-question gauntlet."""
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

    # 1. ENFORCE CALENDAR LOCK - Prevent double submissions for today
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    
    if user.last_quiz_date == today:
        raise HTTPException(
            status_code=400, 
            detail="Daily Gauntlet evaluation already recorded for today. Come back tomorrow!"
        )
        
    # 2. Daily Streak Logic
    if user.last_quiz_date == yesterday:
        user.daily_streak += 1
    else:
        user.daily_streak = 1
        
    # 3. Update telemetry and XP (50 XP per correct answer)
    user.last_quiz_date = today
    
    score = getattr(payload, 'daily_correct', getattr(payload, 'score', 0))
    user.daily_correct += score
    
    xp_gained = score * 50
    user.current_xp += xp_gained

    # 4. Process structural sequential level-ups
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
    artwork_url = res["sprites"]["other"]["official-artwork"]["front_default"]
    
    if not artwork_url:
        artwork_url = res["sprites"]["front_default"]
        
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
    artwork_url = res["sprites"]["other"]["official-artwork"]["front_default"]
    if not artwork_url:
        artwork_url = res["sprites"]["front_default"]

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