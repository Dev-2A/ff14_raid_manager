from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from ..models.player import Player
from ..models.item import Item
from ..models.raid_party import RaidParty
from ..crud import loot_record, player_item_priority
from ..services import gear_calculation

def determine_item_recipient(db: Session, raid_party_id: int, item_id: int) -> Optional[Dict[str, Any]]:
    raid_party = db.query(RaidParty).filter(RaidParty.id == raid_party_id).first()
    if not raid_party:
        return None # Raid party not found

    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None # Item not found

    eligible_candidates = []

    for player in raid_party.players:
        # 1. Check "One item per week" rule
        if loot_record.has_received_item_this_week(db, player.id):
            continue # Player is not eligible this week

        # 2. Check "Eat and Go" rule
        if not loot_record.is_eligible_for_eat_and_go(db, player.id, item.id, raid_party_id):
            continue # Player is not eligible due to Eat and Go rule

        # 3. Evaluate Priority and BiS Needs
        priority_score = 0
        player_priority = player_item_priority.get_player_item_priority(db, player.id, item.id, raid_party_id)
        if player_priority:
            # Lower priority_order means higher priority (e.g., 1 is highest)
            priority_score = 100 - player_priority.priority_order # Convert to a score where higher is better

        bis_needs = gear_calculation.calculate_bis_needs(db, player.id)
        is_needed_for_bis = any(needed_item['item_id'] == item.id for needed_item in bis_needs)

        bis_score = 0
        if is_needed_for_bis:
            bis_score = 50 # Arbitrary score for needing it for BiS

        # Combine scores (simple sum for now, can be weighted)
        total_score = priority_score + bis_score

        eligible_candidates.append({
            "player": player,
            "score": total_score,
            "priority_order": player_priority.priority_order if player_priority else None,
            "is_needed_for_bis": is_needed_for_bis
        })
    
    # Sort candidates by score (descending) and then by priority_order (ascending if scores are equal)
    eligible_candidates.sort(key=lambda x: (x['score'], -(x['priority_order'] if x['priority_order'] is not None else float('inf'))), reverse=True)

    if eligible_candidates:
        # Return the top candidate's player details
        top_candidate_player = eligible_candidates[0]['player']
        return {
            "player_id": top_candidate_player.id,
            "character_nickname": top_candidate_player.character_nickname,
            "user_id": top_candidate_player.user_id,
            "job_id": top_candidate_player.job_id,
            "score": eligible_candidates[0]['score']
        }
    return None
