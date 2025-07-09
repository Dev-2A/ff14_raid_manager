from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from datetime import datetime, timedelta

from ..models.loot_record import LootRecord
from ..models.player import Player
from ..models.item import Item
from ..models.raid_party import RaidParty

def get_total_items_distributed_per_raid_party(db: Session) -> List[Dict[str, Any]]:
    results = db.query(
        RaidParty.name,
        func.count(LootRecord.id)
    ).join(LootRecord, RaidParty.id == LootRecord.raid_party_id)
    .group_by(RaidParty.name)
    .all()
    return [{"raid_party_name": name, "total_items": count} for name, count in results]

def get_total_items_distributed_per_player(db: Session, raid_party_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = db.query(
        Player.character_nickname,
        func.count(LootRecord.id)
    ).join(LootRecord, Player.id == LootRecord.player_id)

    if raid_party_id:
        query = query.filter(LootRecord.raid_party_id == raid_party_id)
    
    results = query.group_by(Player.character_nickname).all()
    return [{"player_nickname": nickname, "total_items": count} for nickname, count in results]

def get_items_distributed_per_item_type_and_slot(db: Session) -> List[Dict[str, Any]]:
    results = db.query(
        Item.category,
        Item.slot,
        func.count(LootRecord.id)
    ).join(LootRecord, Item.id == LootRecord.item_id)
    .group_by(Item.category, Item.slot)
    .all()
    return [{"item_category": category.value, "item_slot": slot.value, "total_items": count} for category, slot, count in results]

def get_weekly_distribution_count_per_player(db: Session, raid_party_id: Optional[int] = None) -> List[Dict[str, Any]]:
    now_utc = datetime.utcnow()
    # Calculate the start of the current week (Tuesday 08:00 UTC)
    days_since_tuesday = (now_utc.isoweekday() - 2 + 7) % 7
    start_of_week = now_utc - timedelta(days=days_since_tuesday)
    start_of_week = start_of_week.replace(hour=8, minute=0, second=0, microsecond=0)

    if now_utc < start_of_week:
        start_of_week -= timedelta(weeks=1)

    query = db.query(
        Player.character_nickname,
        func.count(LootRecord.id)
    ).join(LootRecord, Player.id == LootRecord.player_id)
    .filter(LootRecord.distribution_date >= start_of_week)

    if raid_party_id:
        query = query.filter(LootRecord.raid_party_id == raid_party_id)

    results = query.group_by(Player.character_nickname).all()
    return [{"player_nickname": nickname, "weekly_items": count} for nickname, count in results]
