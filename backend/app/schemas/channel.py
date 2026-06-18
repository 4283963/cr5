from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.tag import Tag


class ChannelBase(BaseModel):
    machine_id: int = Field(..., description="所属机器ID")
    channel_code: str = Field(..., max_length=50, description="货道编号")
    tag_id: Optional[int] = Field(None, description="关联标签ID")
    stock: Optional[int] = Field(0, description="当前库存")
    max_stock: Optional[int] = Field(10, description="最大库存")
    is_enabled: Optional[bool] = Field(True, description="是否启用")


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    tag_id: Optional[int] = Field(None)
    stock: Optional[int] = Field(None)
    max_stock: Optional[int] = Field(None)
    is_enabled: Optional[bool] = Field(None)
    status: Optional[str] = Field(None, max_length=20)


class Channel(ChannelBase):
    id: int
    status: str
    last_dispense_at: Optional[datetime]
    stock_in_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    tag: Optional[Tag] = None

    class Config:
        from_attributes = True
