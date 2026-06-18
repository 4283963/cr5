from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MachineBase(BaseModel):
    code: str = Field(..., max_length=50, description="机器编号")
    name: str = Field(..., max_length=100, description="机器名称")
    location: Optional[str] = Field("", max_length=200, description="安装位置")
    ip_address: Optional[str] = Field("", max_length=50, description="IP地址")
    total_channels: Optional[int] = Field(0, description="货道总数")
    is_enabled: Optional[bool] = Field(True, description="是否启用")


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    ip_address: Optional[str] = Field(None, max_length=50)
    total_channels: Optional[int] = Field(None)
    is_enabled: Optional[bool] = Field(None)
    status: Optional[str] = Field(None, max_length=20)


class Machine(MachineBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
