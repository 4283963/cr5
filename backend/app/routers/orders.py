from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.order import Order, OrderCreate, OrderUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["订单管理"])


@router.get("", response_model=List[Order], summary="获取订单列表")
def list_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    machine_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    return service.list_orders(skip=skip, limit=limit, status=status, machine_id=machine_id)


@router.get("/{order_id}", response_model=Order, summary="获取订单详情")
def get_order(order_id: int, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.get("/no/{order_no}", response_model=Order, summary="根据订单号查询")
def get_order_by_no(order_no: str, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.get_order_by_no(order_no)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("", response_model=Order, summary="创建订单")
def create_order(order_create: OrderCreate, db: Session = Depends(get_db)):
    service = OrderService(db)
    try:
        return service.create_order(order_create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{order_id}", response_model=Order, summary="更新订单")
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.update_order(order_id, order_update)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("/{order_id}/dispense", response_model=Order, summary="执行订单出货")
async def dispense_order(order_id: int, db: Session = Depends(get_db)):
    service = OrderService(db)
    try:
        order = await service.dispense_order(order_id)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/cancel", response_model=Order, summary="取消订单")
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    service = OrderService(db)
    order = service.cancel_order(order_id)
    if not order:
        raise HTTPException(status_code=400, detail="订单无法取消或不存在")
    return order


@router.get("/statistics/summary", summary="获取订单统计")
def get_order_statistics(machine_id: Optional[int] = None, db: Session = Depends(get_db)):
    service = OrderService(db)
    return service.get_order_statistics(machine_id=machine_id)
