from sqlalchemy.orm import Session
import models
import schemas

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
        return "Super Nerd"
    return "Youngster"

def update_user_xp(db: Session, user_id: int, is_correct: bool):
    user = get_user(db, user_id)
    if not user:
        return None, False

    leveled_up = False
    
    if is_correct:
        user.current_xp += 20
        
        # Check and process potential level ups sequentially
        # Formula threshold: Current Level * 100
        while user.current_xp >= (user.level * 100):
            user.current_xp -= (user.level * 100)
            user.level += 1
            leveled_up = True
            user.title = determine_title(user.level)
            
        db.commit()
        db.refresh(user)
        
    return user, leveled_up