from sqlalchemy.orm import Session
from ..models.loot_record import LootRecord
from ..schemas.loot_record import LootRecordCreate
from ..models.player import Player
from datetime import datetime, timedelta

def create_loot_record(db: Session, loot_record: LootRecordCreate):
    db_loot_record = LootRecord(**loot_record.dict())
    db.add(db_loot_record)
    db.commit()
    db.refresh(db_loot_record)
    return db_loot_record

def is_eligible_for_eat_and_go(db: Session, player_id: int, item_id: int, raid_party_id: int) -> bool:
    # Get all players in the raid party
    all_players_in_party = db.query(Player).filter(Player.raid_party_id == raid_party_id).all()
    all_player_ids_in_party = {p.id for p in all_players_in_party}

    # Get all loot records for this item in this raid party
    item_loot_records = db.query(LootRecord).filter(
        LootRecord.item_id == item_id,
        LootRecord.raid_party_id == raid_party_id
    ).all()

    # Identify players who have received this item
    players_who_received_item = {lr.player_id for lr in item_loot_records}

    # Check if the current player has received this item
    if player_id not in players_who_received_item:
        # If the player has not received it, they are eligible
        return True
    else:
        # If the player has received it, check if all other players have also received it
        # This means checking if the set of players who received the item is equal to the set of all players in the party
        # If they are equal, it means a full cycle has completed, and the player is eligible again.
        return players_who_received_item == all_player_ids_in_party

def has_received_item_this_week(db: Session, player_id: int) -> bool:
    now_utc = datetime.utcnow()

    # Calculate the start of the week (Tuesday 08:00 UTC)
    # Find the most recent Tuesday
    # isoweekday(): Monday is 1, Sunday is 7
    # Tuesday is 2
    days_since_tuesday = (now_utc.isoweekday() - 2 + 7) % 7
    start_of_week = now_utc - timedelta(days=days_since_tuesday)
    start_of_week = start_of_week.replace(hour=8, minute=0, second=0, microsecond=0)

    # If current time is before Tuesday 08:00 UTC, then the start of the week is the Tuesday of the *previous* week
    if now_utc < start_of_week:
        start_of_week -= timedelta(weeks=1)

    records_this_week = db.query(LootRecord).filter(
        LootRecord.player_id == player_id,
        LootRecord.distribution_date >= start_of_week
    ).count()

    return records_this_week > 0
