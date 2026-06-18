from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.tag import Tag
from app.schemas.channel import Channel


class OrderItemBase(BaseModel):
    tag_id: int = Field(..., description="图书标签ID")
    quantity: int = Field(1, ge=1, description="数量")


class OrderItemCreate(OrderItemBase):
    pass


class OrderItem(BaseModel):
    id: int
    order_id: int
    tag_id: int
    channel_id: Optional[int]
    quantity: int
    status: str
    dispensed_at: Optional[datetime]
    tag: Optional[Tag] = None
    channel: Optional[Channel] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    user_id: Optional[str] = Field("", max_length=50, description="用户ID")
    machine_id: int = Field(..., description="机器ID")
    remark: Optional[str] = Field("", max_length=200, description="备注")


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., description="订单项列表")


class OrderUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=20)
    remark: Optional[str] = Field(None, max_length=200)


class Order(OrderBase):
    id: int
    order_no: str
    status: str
    total_quantity: int
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = []

    class Config:
        from_attributes = True


class DispenseResult(BaseModel):
    success: bool
    message: str
    channel_id: Optional[int] = None
    channel_code: Optional[str] = None
