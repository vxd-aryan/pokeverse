import time
import requests
from sqlalchemy.orm import Session
import sys
import os

# Ensure the 'app' module can be found if run from the terminal
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import Pokemon

# Number of Pokémon to fetch (Gen 1)
TOTAL_POKEMON = 151
POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/{}"

def seed_pokemon(db: Session):
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print(f"Fetching {TOTAL_POKEMON} Pokémon from PokéAPI...")
    
    for poke_id in range(1, TOTAL_POKEMON + 1):
        try:
            response = requests.get(POKEAPI_URL.format(poke_id))
            response.raise_for_status()
            data = response.json()
            
            # Extract basic info
            name = data['name'].capitalize()
            
            # Extract types
            types = data['types']
            primary_type = types[0]['type']['name'].capitalize()
            secondary_type = types[1]['type']['name'].capitalize() if len(types) > 1 else None
            
            # Extract URLs
            sprite_url = data['sprites']['front_default']
            artwork_url = data['sprites']['other']['official-artwork']['front_default']
            
            # Create DB object
            db_pokemon = Pokemon(
                id=poke_id,
                name=name,
                primary_type=primary_type,
                secondary_type=secondary_type,
                sprite_url=sprite_url,
                artwork_url=artwork_url
            )
            
            db.add(db_pokemon)
            print(f"Seeded: #{poke_id} {name}")
            
            # Sleep to respect rate limits
            time.sleep(0.1)
            
        except requests.RequestException as e:
            print(f"Failed to fetch Pokémon #{poke_id}: {e}")
            continue

    db.commit()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_pokemon(db)
    finally:
        db.close()