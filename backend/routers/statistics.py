from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..db.database import SessionLocal
from ..services import statistics

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/statistics/total_items_per_raid_party", response_model=List[Dict[str, Any]])
def get_total_items_per_raid_party(db: Session = Depends(get_db)):
    return statistics.get_total_items_distributed_per_raid_party(db)

@router.get("/statistics/total_items_per_player", response_model=List[Dict[str, Any]])
def get_total_items_per_player(raid_party_id: Optional[int] = None, db: Session = Depends(get_db)):
    return statistics.get_total_items_distributed_per_player(db, raid_party_id)

@router.get("/statistics/items_per_type_and_slot", response_model=List[Dict[str, Any]])
def get_items_per_type_and_slot(db: Session = Depends(get_db)):
    return statistics.get_items_distributed_per_item_type_and_slot(db)

@router.get("/statistics/weekly_distribution_per_player", response_model=List[Dict[str, Any]])
def get_weekly_distribution_per_player(raid_party_id: Optional[int] = None, db: Session = Depends(get_db)):
    return statistics.get_weekly_distribution_count_per_player(db, raid_party_id)
