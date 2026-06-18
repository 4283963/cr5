import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.tag import Tag
from app.models.machine import Machine
from app.models.channel import Channel
from app.services.device_communication import device_simulator


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("正在初始化示例数据...")

        if db.query(Tag).count() == 0:
            tags_data = [
                {"name": "文学小说", "color": "#3b82f6", "description": "经典文学与现代小说"},
                {"name": "科技科普", "color": "#10b981", "description": "科技与科普读物"},
                {"name": "历史人文", "color": "#f59e0b", "description": "历史与人文社科"},
                {"name": "经管励志", "color": "#ef4444", "description": "经济管理与自我提升"},
                {"name": "艺术设计", "color": "#8b5cf6", "description": "艺术与设计类书籍"},
                {"name": "生活休闲", "color": "#ec4899", "description": "生活方式与休闲读物"},
            ]
            for tag_data in tags_data:
                tag = Tag(**tag_data)
                db.add(tag)
            db.commit()
            print(f"  - 创建了 {len(tags_data)} 个标签")

        tags = db.query(Tag).all()
        tag_map = {tag.name: tag for tag in tags}

        if db.query(Machine).count() == 0:
            machines_data = [
                {
                    "code": "M001",
                    "name": "一号分拣机",
                    "location": "北京朝阳区仓储中心",
                    "ip_address": "192.168.1.101",
                    "total_channels": 12,
                },
                {
                    "code": "M002",
                    "name": "二号分拣机",
                    "location": "上海浦东区分拣站",
                    "ip_address": "192.168.1.102",
                    "total_channels": 16,
                },
            ]

            for m_data in machines_data:
                machine = Machine(**m_data, status="online", is_enabled=True)
                db.add(machine)
                db.flush()

                channel_count = m_data["total_channels"]
                for i in range(channel_count):
                    channel_code = f"A{i+1:03d}"
                    tag_index = i % len(tags)
                    tag = tags[tag_index]

                    channel = Channel(
                        machine_id=machine.id,
                        channel_code=channel_code,
                        tag_id=tag.id,
                        stock=5 + (i % 6),
                        max_stock=10,
                        is_enabled=True,
                        status="normal",
                    )
                    db.add(channel)

                device_simulator.register_machine(machine.code, machine.ip_address)
                device_simulator.set_machine_online(machine.code, True)

            db.commit()
            print(f"  - 创建了 {len(machines_data)} 台机器及其货道")

        print("\n初始化完成！")
        print(f"  标签数量: {db.query(Tag).count()}")
        print(f"  机器数量: {db.query(Machine).count()}")
        print(f"  货道数量: {db.query(Channel).count()}")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
