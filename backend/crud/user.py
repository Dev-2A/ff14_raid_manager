from sqlalchemy.orm import Session
from ..models.user import User
from ..schemas.user import UserCreate

# In a real app, you'd use a proper password hashing library like passlib
# For simplicity, we'll just store the password as is for now.
# This is NOT secure and should be changed.
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    # In a real app, hash the password. For now, storing it plain.
    # fake_hashed_password = user.password + "notreallyhashed"
    db_user = User(email=user.email, username=user.username, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
