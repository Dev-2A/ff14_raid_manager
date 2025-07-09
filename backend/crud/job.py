from sqlalchemy.orm import Session
from ..models.job import Job
from ..schemas.job import JobCreate

def get_job_by_name(db: Session, name: str):
    return db.query(Job).filter(Job.name == name).first()

def create_job(db: Session, job: JobCreate):
    db_job = Job(name=job.name, role=job.role)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job
