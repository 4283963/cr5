from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.machine import Machine, MachineCreate, MachineUpdate
from app.services.machine_service import MachineService

router = APIRouter(prefix="/machines", tags=["机器管理"])


@router.get("", response_model=List[Machine], summary="获取机器列表")
def list_machines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = MachineService(db)
    return service.list_machines(skip=skip, limit=limit)


@router.get("/{machine_id}", response_model=Machine, summary="获取机器详情")
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    service = MachineService(db)
    machine = service.get_machine(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="机器不存在")
    return machine


@router.post("", response_model=Machine, summary="创建机器")
def create_machine(machine_create: MachineCreate, db: Session = Depends(get_db)):
    service = MachineService(db)
    existing = service.get_machine_by_code(machine_create.code)
    if existing:
        raise HTTPException(status_code=400, detail="机器编号已存在")
    return service.create_machine(machine_create)


@router.put("/{machine_id}", response_model=Machine, summary="更新机器")
def update_machine(machine_id: int, machine_update: MachineUpdate, db: Session = Depends(get_db)):
    service = MachineService(db)
    machine = service.update_machine(machine_id, machine_update)
    if not machine:
        raise HTTPException(status_code=404, detail="机器不存在")
    return machine


@router.delete("/{machine_id}", summary="删除机器")
def delete_machine(machine_id: int, db: Session = Depends(get_db)):
    service = MachineService(db)
    success = service.delete_machine(machine_id)
    if not success:
        raise HTTPException(status_code=404, detail="机器不存在")
    return {"message": "删除成功"}


@router.post("/{machine_id}/online", response_model=Machine, summary="设置机器上线")
def set_machine_online(machine_id: int, db: Session = Depends(get_db)):
    service = MachineService(db)
    machine = service.set_machine_online(machine_id, True)
    if not machine:
        raise HTTPException(status_code=404, detail="机器不存在")
    return machine


@router.post("/{machine_id}/offline", response_model=Machine, summary="设置机器下线")
def set_machine_offline(machine_id: int, db: Session = Depends(get_db)):
    service = MachineService(db)
    machine = service.set_machine_online(machine_id, False)
    if not machine:
        raise HTTPException(status_code=404, detail="机器不存在")
    return machine


@router.get("/{machine_id}/device-status", summary="查询设备状态")
def get_device_status(machine_id: int, db: Session = Depends(get_db)):
    service = MachineService(db)
    status = service.get_machine_status_from_device(machine_id)
    if status is None:
        raise HTTPException(status_code=404, detail="机器不存在")
    return status
