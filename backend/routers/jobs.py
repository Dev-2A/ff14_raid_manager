from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..db.database import SessionLocal

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/jobs/", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = crud.job.get_job_by_name(db, name=job.name)
    if db_job:
        raise HTTPException(status_code=400, detail="Job already registered")
    return crud.job.create_job(db=db, job=job)
