from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_optional_current_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[schemas.JobResponse])
async def get_jobs(
    role: Optional[models.RoleEnum] = Query(None, description="역할로 필터"),
    db: Session = Depends(get_db)
) -> Any:
    """
    직업 목록 조회
    
    인증 없이도 조회 가능합니다.
    - **role**: 특정 역할의 직업만 조회 (tank, healer, melee_dps, ranged_dps, magic_dps)
    """
    if role:
        jobs = crud.get_jobs_by_role(db, role)
    else:
        jobs = crud.get_jobs(db)
    
    return jobs

@router.get("/{job_id}", response_model=schemas.JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    특정 직업 정보 조회
    
    인증 없이도 조회 가능합니다.
    """
    job = crud.get_job(db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="직업을 찾을 수 없습니다"
        )
    return job

@router.post("/", response_model=schemas.JobResponse)
async def create_job(
    job: schemas.JobCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    새 직업 생성 - 관리자 전용
    
    일반적으로는 사용하지 않습니다. 직업은 서버 시작 시 자동으로 생성됩니다.
    """
    # 중복 확인
    existing_job = db.query(models.Job).filter(
        db.or_(
            models.Job.name_kr == job.name_kr,
            models.Job.name_en == job.name_en
        )
    ).first()
    
    if existing_job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 직업입니다"
        )
    
    new_job = crud.create_job(db, job)
    return new_job

@router.get("/statistics/composition")
async def get_job_statistics(
    db: Session = Depends(get_db)
) -> Any:
    """
    직업 통계 정보
    
    역할별 직업 수와 전체 공대에서의 직업 분포를 조회합니다.
    """
    # 역할별 직업 수
    role_counts = {}
    all_jobs = crud.get_jobs(db)
    
    for job in all_jobs:
        role = job.role.value
        if role not in role_counts:
            role_counts[role] = []
        role_counts[role].append({
            "id": job.id,
            "name_kr": job.name_kr,
            "name_en": job.name_en
        })
    
    # 전체 공대에서의 직업 사용 통계
    job_usage = db.query(
        models.Job.name_kr,
        db.func.count(models.PartyMember.id).label('count')
    ).join(
        models.PartyMember
    ).filter(
        models.PartyMember.is_active == True
    ).group_by(models.Job.id).all()
    
    return {
        "total_jobs": len(all_jobs),
        "jobs_by_role": role_counts,
        "job_usage_statistics": [
            {"job_name": name, "usage_count": count} 
            for name, count in job_usage
        ]
    }