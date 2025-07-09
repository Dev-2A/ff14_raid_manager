from sqlalchemy.orm import Session
from ..models.item import Item
from ..schemas.item import ItemCreate

def get_item_by_name(db: Session, name: str):
    return db.query(Item).filter(Item.name == name).first()

def create_item(db: Session, item: ItemCreate):
    db_item = Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
