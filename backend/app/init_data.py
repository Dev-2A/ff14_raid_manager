from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
import logging

logger = logging.getLogger(__name__)

def initialize_jobs():
    """직업 초기 데이터 설정"""
    db: Session = SessionLocal()
    
    try:
        # 이미 직업 데이터가 있는지 확인
        existing_jobs = db.query(models.Job).count()
        if existing_jobs > 0:
            logger.info(f"직업 데이터가 이미 존재합니다 ({existing_jobs}개)")
            return
        
        # 직업 데이터 정의
        jobs_data = [
            # 탱커
            {"name_kr": "나이트", "name_en": "Paladin", "role": models.RoleEnum.TANK, "icon_name": "나이트"},
            {"name_kr": "전사", "name_en": "Warrior", "role": models.RoleEnum.TANK, "icon_name": "전사"},
            {"name_kr": "암흑기사", "name_en": "Dark Knight", "role": models.RoleEnum.TANK, "icon_name": "암흑기사"},
            {"name_kr": "건브레이커", "name_en": "Gunbreaker", "role": models.RoleEnum.TANK, "icon_name": "건브레이커"},
            
            # 힐러
            {"name_kr": "백마도사", "name_en": "White Mage", "role": models.RoleEnum.HEALER, "icon_name": "백마도사"},
            {"name_kr": "학자", "name_en": "Scholar", "role": models.RoleEnum.HEALER, "icon_name": "학자"},
            {"name_kr": "점성술사", "name_en": "Astrologian", "role": models.RoleEnum.HEALER, "icon_name": "점성술사"},
            {"name_kr": "현자", "name_en": "Sage", "role": models.RoleEnum.HEALER, "icon_name": "현자"},
            
            # 근거리 딜러
            {"name_kr": "몽크", "name_en": "Monk", "role": models.RoleEnum.MELEE_DPS, "icon_name": "몽크"},
            {"name_kr": "용기사", "name_en": "Dragoon", "role": models.RoleEnum.MELEE_DPS, "icon_name": "용기사"},
            {"name_kr": "닌자", "name_en": "Ninja", "role": models.RoleEnum.MELEE_DPS, "icon_name": "닌자"},
            {"name_kr": "사무라이", "name_en": "Samurai", "role": models.RoleEnum.MELEE_DPS, "icon_name": "사무라이"},
            {"name_kr": "리퍼", "name_en": "Reaper", "role": models.RoleEnum.MELEE_DPS, "icon_name": "리퍼"},
            {"name_kr": "바이퍼", "name_en": "Viper", "role": models.RoleEnum.MELEE_DPS, "icon_name": "바이퍼"},
            
            # 원거리 딜러
            {"name_kr": "음유시인", "name_en": "Bard", "role": models.RoleEnum.RANGED_DPS, "icon_name": "음유"},
            {"name_kr": "기공사", "name_en": "Machinist", "role": models.RoleEnum.RANGED_DPS, "icon_name": "기공사"},
            {"name_kr": "무도가", "name_en": "Dancer", "role": models.RoleEnum.RANGED_DPS, "icon_name": "무도가"},
            
            # 마법 딜러
            {"name_kr": "흑마도사", "name_en": "Black Mage", "role": models.RoleEnum.MAGIC_DPS, "icon_name": "흑마도사"},
            {"name_kr": "소환사", "name_en": "Summoner", "role": models.RoleEnum.MAGIC_DPS, "icon_name": "소환사"},
            {"name_kr": "적마도사", "name_en": "Red Mage", "role": models.RoleEnum.MAGIC_DPS, "icon_name": "적마도사"},
            {"name_kr": "픽토맨서", "name_en": "Pictomancer", "role": models.RoleEnum.MAGIC_DPS, "icon_name": "픽토맨서"},
        ]
        
        # 직업 데이터 삽입
        for job_data in jobs_data:
            job = models.Job(**job_data)
            db.add(job)
        
        db.commit()
        logger.info(f"{len(jobs_data)}개의 직업 데이터를 추가했습니다")
        
    except Exception as e:
        logger.error(f"직업 데이터 초기화 중 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

def initialize_test_data():
    """테스트용 초기 데이터 설정 (개발 환경에서만 사용)"""
    db: Session = SessionLocal()
    
    try:
        # 테스트 사용자 생성
        from .auth import get_password_hash
        
        # 관리자 계정
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                email="admin@ff14raid.com",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("관리자 계정 생성 완료")
        
        # 테스트 레이드 생성
        raid = db.query(models.Raid).filter(models.Raid.patch_number == "7.0").first()
        if not raid:
            raid = models.Raid(
                name="아르카디아 - 라이트헤비",
                patch_number="7.0",
                is_current=True
            )
            db.add(raid)
            db.commit()
            logger.info("테스트 레이드 생성 완료")
        
    except Exception as e:
        logger.error(f"테스트 데이터 초기화 중 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()