from database import SessionLocal, engine, Base
from models import User

def fast_seed():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Creating mock user AshKetchum with fresh stats...")
        mock_user = User(
            id=1,
            username="AshKetchum",
            email="ash@pallet.com",
            hashed_password="some_secure_hash",
            level=3,
            current_xp=250,
            title="Novice Trainer"
        )
        db.add(mock_user)
        db.commit()
        print("🎉 User database successfully seeded!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fast_seed()