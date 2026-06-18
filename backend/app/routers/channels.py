from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.channel import Channel, ChannelCreate, ChannelUpdate
from app.services.channel_service import ChannelService

router = APIRouter(prefix="/channels", tags=["货道管理"])


@router.get("/machine/{machine_id}", response_model=List[Channel], summary="获取机器的货道列表")
def list_channels_by_machine(machine_id: int, db: Session = Depends(get_db)):
    service = ChannelService(db)
    return service.list_channels_by_machine(machine_id)


@router.get("/{channel_id}", response_model=Channel, summary="获取货道详情")
def get_channel(channel_id: int, db: Session = Depends(get_db)):
    service = ChannelService(db)
    channel = service.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="货道不存在")
    return channel


@router.post("", response_model=Channel, summary="创建货道")
def create_channel(channel_create: ChannelCreate, db: Session = Depends(get_db)):
    service = ChannelService(db)
    existing = service.get_channel_by_code(
        channel_create.machine_id, channel_create.channel_code
    )
    if existing:
        raise HTTPException(status_code=400, detail="货道编号已存在")
    return service.create_channel(channel_create)


@router.put("/{channel_id}", response_model=Channel, summary="更新货道")
def update_channel(channel_id: int, channel_update: ChannelUpdate, db: Session = Depends(get_db)):
    service = ChannelService(db)
    channel = service.update_channel(channel_id, channel_update)
    if not channel:
        raise HTTPException(status_code=404, detail="货道不存在")
    return channel


@router.delete("/{channel_id}", summary="删除货道")
def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    service = ChannelService(db)
    success = service.delete_channel(channel_id)
    if not success:
        raise HTTPException(status_code=404, detail="货道不存在")
    return {"message": "删除成功"}


@router.post("/{channel_id}/stock/add", response_model=Channel, summary="增加库存")
def add_stock(channel_id: int, quantity: int = Query(1, ge=1), db: Session = Depends(get_db)):
    service = ChannelService(db)
    channel = service.add_stock(channel_id, quantity)
    if not channel:
        raise HTTPException(status_code=404, detail="货道不存在")
    return channel


@router.post("/{channel_id}/stock/reduce", response_model=Channel, summary="减少库存")
def reduce_stock(channel_id: int, quantity: int = Query(1, ge=1), db: Session = Depends(get_db)):
    service = ChannelService(db)
    channel = service.reduce_stock(channel_id, quantity)
    if not channel:
        raise HTTPException(status_code=404, detail="货道不存在或库存不足")
    return channel


@router.get("/tag/{tag_id}/stock", summary="获取标签在机器上的总库存")
def get_tag_stock(machine_id: int, tag_id: int, db: Session = Depends(get_db)):
    service = ChannelService(db)
    total = service.get_total_stock_by_tag(machine_id, tag_id)
    return {"machine_id": machine_id, "tag_id": tag_id, "total_stock": total}
