from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..db.database import SessionLocal
from ..services import distribution_algorithm

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/distribution/recommend_recipient/{raid_party_id}/{item_id}", response_model=Optional[Dict[str, Any]])
def recommend_recipient(
    raid_party_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    recipient = distribution_algorithm.determine_item_recipient(db, raid_party_id, item_id)
    if recipient is None:
        raise HTTPException(status_code=404, detail="No eligible recipient found or invalid IDs")
    return recipient
