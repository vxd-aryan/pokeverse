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


# ============================================================
# LEVELLING — the single definition
# ============================================================
# This used to be written three different ways, and two of them
# disagreed about what `current_xp` even means:
#
#   * The quiz routes treated it as progress WITHIN the current
#     level, subtracting the threshold on each level-up.
#   * update_player_xp_and_stats treated it as a LIFETIME total,
#     recomputing level as (current_xp // 100) + 1.
#
# Those cannot both be right, and the clash corrupted data: a
# level-10 trainer sitting on 50 banked XP who won a battle had
# their level recomputed as (100 // 100) + 1 = 2. Winning
# demoted them.
#
# The remainder model wins, because the quiz routes and the
# frontend's XP bar both already assume it. `current_xp` is
# progress toward the next level; the threshold rises with level.

XP_BASE = 100


def xp_threshold(level: int) -> int:
    """XP needed to clear `level`. 100 at level 1, 200 at level 2, ..."""
    return max(1, level) * XP_BASE


def apply_xp_gain(user, xp_gained: int) -> None:
    """Adds XP and rolls levels forward, carrying the remainder.

    The one place levels go up. main.py delegates here so the quiz
    routes and the battle arena can never drift apart again.
    """
    if xp_gained <= 0:
        return

    user.current_xp = (user.current_xp or 0) + xp_gained
    user.level = user.level or 1

    while user.current_xp >= xp_threshold(user.level):
        user.current_xp -= xp_threshold(user.level)
        user.level += 1

    user.title = determine_title(user.level)


def apply_xp_loss(user, xp_lost: int) -> None:
    """Deducts XP without ever de-levelling.

    Losing a battle costs progress toward the next level, but can't
    take a title away — which matches how the penalty behaved before
    and avoids a trainer bouncing between levels on a losing streak.
    """
    if xp_lost <= 0:
        return
    user.current_xp = max(0, (user.current_xp or 0) - xp_lost)


def _bump(user, field: str, amount: int = 1) -> None:
    """Increments a counter that may be NULL on older rows, or absent
    from the schema entirely if a migration hasn't run.

    The battle telemetry columns (total_critical_hits,
    total_statuses_inflicted) are missing from the Alembic migration
    even though models.py declares them, so writing to them blindly
    raises on any database built from migrations alone.
    """
    if not hasattr(user, field):
        return
    setattr(user, field, (getattr(user, field) or 0) + amount)


def update_player_xp_and_stats(
    db: Session,
    user_id: int,
    is_winner: bool,
    critical_hits: int = 0,
    statuses_inflicted: int = 0,
):
    """Updates XP, Level, Title, Win/Loss, and battle telemetry records after a battle."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    # 1. Win/Loss records & XP
    _bump(user, "battles_played")

    if is_winner:
        _bump(user, "wins")
        apply_xp_gain(user, 50)      # Win reward
    else:
        _bump(user, "losses")
        apply_xp_loss(user, 15)      # Defeat penalty

    # 2. Win rate. Guarded against a zero denominator in case
    #    battles_played is absent from the schema.
    played = getattr(user, "battles_played", 0) or 0
    if hasattr(user, "win_rate") and played > 0:
        user.win_rate = round(((getattr(user, "wins", 0) or 0) / played) * 100, 2)

    # 3. Battle telemetry
    _bump(user, "total_critical_hits", critical_hits)
    _bump(user, "total_statuses_inflicted", statuses_inflicted)

    db.commit()
    db.refresh(user)
    return user