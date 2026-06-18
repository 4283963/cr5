from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.tag import Tag, TagCreate, TagUpdate
from app.services.tag_service import TagService

router = APIRouter(prefix="/tags", tags=["标签管理"])


@router.get("", response_model=List[Tag], summary="获取标签列表")
def list_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = TagService(db)
    return service.list_tags(skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=Tag, summary="获取标签详情")
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    service = TagService(db)
    tag = service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    return tag


@router.post("", response_model=Tag, summary="创建标签")
def create_tag(tag_create: TagCreate, db: Session = Depends(get_db)):
    service = TagService(db)
    existing = service.get_tag_by_name(tag_create.name)
    if existing:
        raise HTTPException(status_code=400, detail="标签名称已存在")
    return service.create_tag(tag_create)


@router.put("/{tag_id}", response_model=Tag, summary="更新标签")
def update_tag(tag_id: int, tag_update: TagUpdate, db: Session = Depends(get_db)):
    service = TagService(db)
    tag = service.update_tag(tag_id, tag_update)
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    return tag


@router.delete("/{tag_id}", summary="删除标签")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    service = TagService(db)
    success = service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="标签不存在")
    return {"message": "删除成功"}
