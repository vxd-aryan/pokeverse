import asyncio
import json
import random
import uuid
import httpx
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app import crud
from app.database import get_db
from app.models import User, Battle, BattleTurn, BattleLog
from app.schemas import BattleHistoryBase
from app.engine import BattleEngine
from app.mechanics import BattleMechanics

router = APIRouter(
    prefix="/api/battle",
    tags=["Battle Arena"]
)

# --- POKEAPI UTILITIES FOR LEVEL 50 MULTIPLAYER ---

async def fetch_random_pokemon_level_50() -> dict:
    """Fetches a random Pokémon (1-1025) and calculates Level 50 stats using BattleMechanics."""
    poke_id = random.randint(1, 1025)
    
    async with httpx.AsyncClient() as client:
        # Fetch Base Pokemon Data
        resp = await client.get(f"https://pokeapi.co/api/v2/pokemon/{poke_id}")
        data = resp.json()
        
        # Calculate Base Stats & Official Level 50 Stats
        base_stats = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}
        max_hp = BattleMechanics.calculate_max_hp(base_stats.get("hp", 80))
        
        stats = {
            "attack": BattleMechanics.calculate_stat(base_stats.get("attack", 80)),
            "defense": BattleMechanics.calculate_stat(base_stats.get("defense", 80)),
            "special-attack": BattleMechanics.calculate_stat(base_stats.get("special-attack", 80)),
            "special-defense": BattleMechanics.calculate_stat(base_stats.get("special-defense", 80)),
            "speed": BattleMechanics.calculate_stat(base_stats.get("speed", 80))
        }
        
        # Pick up to 4 random moves from learnset
        available_moves = data.get("moves", [])
        chosen_moves = random.sample(available_moves, min(4, len(available_moves)))
        
        moves_data = []
        for m in chosen_moves:
            m_resp = await client.get(m["move"]["url"])
            m_data = m_resp.json()
            
            # Stat Changes Mapping
            stat_changes_dict = {}
            for sc in m_data.get("stat_changes", []):
                stat_changes_dict[sc["stat"]["name"]] = sc["change"]
            
            # Status Effects Mapping
            meta = m_data.get("meta") or {}
            ailment = meta.get("ailment", {}).get("name", "none")
            status_effect = ailment if ailment != "none" else None
            
            status_chance = meta.get("ailment_chance", 0)
            if status_effect and status_chance == 0:
                status_chance = 100
                
            target_raw = m_data.get("target", {}).get("name", "selected-pokemon")
            target_parsed = "self" if "user" in target_raw else "opponent"

            pp_val = m_data.get("pp") or 35

            moves_data.append({
                "id": str(m_data.get("id", m_data["name"])),
                "name": m_data["name"],
                "power": m_data.get("power") or 0,
                "accuracy": m_data.get("accuracy") or 100,
                "type": m_data["type"]["name"].lower(),
                "damage_class": m_data["damage_class"]["name"].lower(),
                "priority": m_data.get("priority") or 0,
                "current_pp": pp_val,
                "max_pp": pp_val,
                "status_effect": status_effect,
                "status_chance": status_chance,
                "stat_changes": stat_changes_dict if stat_changes_dict else None,
                "target": target_parsed
            })
            
        return {
            "pokemon_id": poke_id,
            "name": data["name"],
            "level": 50,
            "max_hp": max_hp,
            "current_hp": max_hp,
            "types": [t["type"]["name"].lower() for t in data["types"]],
            "base_stats": base_stats,
            "stats": stats,
            "status_condition": None,
            "volatile_statuses": [],
            "sleep_turns": 0,
            "toxic_turns": 0,
            "is_fainted": False,
            "moves": moves_data,
            "stat_stages": {
                "attack": 0, 
                "defense": 0, 
                "special-attack": 0, 
                "special-defense": 0, 
                "speed": 0,
                "accuracy": 0,
                "evasion": 0
            }
        }


# --- WEBSOCKET CONNECTION MANAGER ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.waiting_room: List[int] = []
        self.active_rooms: Dict[str, dict] = {} 
        self.user_rooms: Dict[int, str] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.waiting_room:
            self.waiting_room.remove(user_id)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_rooms:
            players = self.active_rooms[room_id]["players"]
            for player_id in players:
                await self.send_personal_message(message, player_id)

    async def try_matchmaking(self, db: Session):
        """Checks if two players are waiting. If so, creates a room and starts a battle."""
        if len(self.waiting_room) >= 2:
            player1_id = self.waiting_room.pop(0)
            player2_id = self.waiting_room.pop(0)
            
            room_id = str(uuid.uuid4())
            self.user_rooms[player1_id] = room_id
            self.user_rooms[player2_id] = room_id
            
            # Fetch random level 50 Pokemon
            p1_pokemon = await fetch_random_pokemon_level_50()
            p2_pokemon = await fetch_random_pokemon_level_50()
            
            initial_state = {
                "turn_count": 0,
                "weather": "none", 
                "weather_turns": 0,
                "telemetry_damage_dealt": 0, 
                "telemetry_damage_received": 0,
                f"active_{player1_id}": p1_pokemon,
                f"active_{player2_id}": p2_pokemon,
            }
            
            # Initialize engine and room state
            engine = BattleEngine(initial_state)
            self.active_rooms[room_id] = {
                "players": [player1_id, player2_id],
                "engine": engine,
                "actions": {}
            }
            
            # Notify both players match started
            await self.broadcast_to_room(room_id, {
                "type": "match_found",
                "room_id": room_id,
                "state": initial_state,
                "players": {"player1": player1_id, "player2": player2_id},
                "message": "Match found! Arena gates open."
            })

manager = ConnectionManager()

# --- REST HELPERS ---

def get_current_user_rest(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    user = None
    if authorization and authorization.startswith("Bearer "):
        user_email = authorization.split(" ")[1]
        user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        user = db.query(User).first()
        if not user:
            user = User(username="TestTrainer", email="test@pokemon.com", password_hash="fake", current_xp=0, level=1, title="Novice")
            db.add(user)
            db.commit()
            db.refresh(user)
    return user


# --- MAIN MULTIPLAYER WEBSOCKET ENDPOINT ---

@router.websocket("/ws")
async def websocket_battle_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time multiplayer battles.
    """
    user = db.query(User).filter(User.email == token).first()
    if not user:
        user = db.query(User).first()
        
    user_id = user.id
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            action_type = data.get("action")
            
            if action_type == "find_match":
                if user_id not in manager.waiting_room and user_id not in manager.user_rooms:
                    manager.waiting_room.append(user_id)
                    await manager.send_personal_message({"type": "queue_status", "message": "Waiting for opponent..."}, user_id)
                    await manager.try_matchmaking(db)
                    
            elif action_type == "use_move":
                room_id = manager.user_rooms.get(user_id)
                if not room_id or room_id not in manager.active_rooms:
                    continue
                    
                room = manager.active_rooms[room_id]
                engine = room["engine"]
                
                # Retrieve move choice
                player_key = f"active_{user_id}"
                pokemon_data = engine.state[player_key]
                selected_move = next((m for m in pokemon_data["moves"] if m["name"] == data.get("move_name")), pokemon_data["moves"][0])
                
                # Lock action
                room["actions"][user_id] = {"action_type": "move", "move": selected_move}
                await manager.send_personal_message({"type": "waiting_on_opponent"}, user_id)
                
                # Execute turn when both players lock in moves
                if len(room["actions"]) == 2:
                    p1_id, p2_id = room["players"]
                    p1_action = room["actions"][p1_id]
                    p2_action = room["actions"][p2_id]
                    
                    next_state, fresh_logs, completed, winner_id = engine.process_multiplayer_turn(
                        p1_id, p1_action, p2_id, p2_action
                    )
                    
                    room["actions"] = {}
                    
                    await manager.broadcast_to_room(room_id, {
                        "type": "turn_result",
                        "state": next_state,
                        "logs": fresh_logs,
                        "completed": completed,
                        "winner_id": winner_id
                    })
                    
                    if completed:
                        crud.update_player_xp_and_stats(db, user_id=p1_id, is_winner=(p1_id == winner_id))
                        crud.update_player_xp_and_stats(db, user_id=p2_id, is_winner=(p2_id == winner_id))

                        del manager.active_rooms[room_id]
                        if p1_id in manager.user_rooms: del manager.user_rooms[p1_id]
                        if p2_id in manager.user_rooms: del manager.user_rooms[p2_id]
                        
            elif action_type == "forfeit":
                room_id = manager.user_rooms.get(user_id)
                if room_id and room_id in manager.active_rooms:
                    room = manager.active_rooms[room_id]
                    other_player = next(p for p in room["players"] if p != user_id)
                    
                    await manager.broadcast_to_room(room_id, {
                        "type": "forfeit_result",
                        "winner_id": other_player,
                        "message": "Opponent fled the battle!"
                    })
                    
                    crud.update_player_xp_and_stats(db, user_id=other_player, is_winner=True)
                    crud.update_player_xp_and_stats(db, user_id=user_id, is_winner=False)
                    
                    del manager.active_rooms[room_id]
                    for p in room["players"]:
                        if p in manager.user_rooms:
                            del manager.user_rooms[p]

    except WebSocketDisconnect:
        room_id = manager.user_rooms.get(user_id)
        if room_id and room_id in manager.active_rooms:
            room = manager.active_rooms[room_id]
            other_player = next(p for p in room["players"] if p != user_id)
            asyncio.create_task(manager.broadcast_to_room(room_id, {
                "type": "forfeit_result",
                "winner_id": other_player,
                "message": "Opponent disconnected!"
            }))
            
            crud.update_player_xp_and_stats(db, user_id=other_player, is_winner=True)
            crud.update_player_xp_and_stats(db, user_id=user_id, is_winner=False)
            
            del manager.active_rooms[room_id]
            for p in room["players"]:
                if p in manager.user_rooms:
                    del manager.user_rooms[p]
                    
        manager.disconnect(user_id)


# --- RETAINED HISTORY ROUTE ---

@router.get("/history", response_model=List[BattleHistoryBase])
def get_battle_history(limit: int = 14, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_rest)):
    return db.query(Battle).filter(Battle.player_id == current_user.id).order_by(Battle.created_at.desc()).limit(limit).all()