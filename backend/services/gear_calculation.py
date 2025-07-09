from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..models.player import Player
from ..models.gear_set import GearSet, GearSetType, GearSetItem
from ..models.item import Item

def calculate_bis_needs(db: Session, player_id: int) -> List[Dict[str, Any]]:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        return []

    bis_gear_set = db.query(GearSet).filter(
        GearSet.player_id == player_id,
        GearSet.set_type == GearSetType.BIS
    ).first()

    starting_gear_set = db.query(GearSet).filter(
        GearSet.player_id == player_id,
        GearSet.set_type == GearSetType.STARTING
    ).first()

    if not bis_gear_set:
        return [] # No BiS set defined, so no needs

    bis_items = {gsi.item.name: gsi.item for gsi in bis_gear_set.gear_set_items}
    starting_items = {gsi.item.name: gsi.item for gsi in starting_gear_set.gear_set_items} if starting_gear_set else {}

    needed_items = []
    for bis_item_name, bis_item in bis_items.items():
        if bis_item_name not in starting_items:
            needed_items.append({
                "item_id": bis_item.id,
                "item_name": bis_item.name,
                "item_slot": bis_item.slot.value,
                "item_source": bis_item.source.value
            })
    
    return needed_items
