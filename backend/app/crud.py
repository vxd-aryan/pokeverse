from sqlalchemy.orm import Session

# Fix: Use absolute imports starting with 'app.'
from app import models
from app import schemas

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def determine_title(level: int) -> str:
    """Calculates user title progression based on their trainer level."""
    if level >= 50:
        return "Pokémon Master"
    elif level >= 30:
        return "Elite Four"
    elif level >= 20:
        return "Gym Leader"
    elif level >= 10:
        return "Ace Trainer"
    elif level >= 5:
        return "Rising Star"
    return "Novice Trainer"

def update_player_xp_and_stats(
    db: Session, 
    user_id: int, 
    is_winner: bool,
    critical_hits: int = 0,
    statuses_inflicted: int = 0
):
    """Updates XP, Level, Title, Win/Loss, and battle telemetry records after a battle."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    # 1. Update Win/Loss records & XP
    user.battles_played += 1
    if is_winner:
        user.wins += 1
        user.current_xp += 50  # Win reward
    else:
        user.losses += 1
        user.current_xp -= 15  # Defeat penalty
        
    # Prevent negative XP
    if user.current_xp < 0:
        user.current_xp = 0

    # Calculate Win Rate
    user.win_rate = round((user.wins / user.battles_played) * 100, 2)

    # 2. Level Up Logic (100 XP per Level)
    user.level = (user.current_xp // 100) + 1

    # 3. Dynamic Title Update
    user.title = determine_title(user.level)

    # 4. ROM Battle Telemetry Updates
    user.total_critical_hits += critical_hits
    user.total_statuses_inflicted += statuses_inflicted

    db.commit()
    db.refresh(user)
    return user