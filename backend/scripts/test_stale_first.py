import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.db.database import SessionLocal
from app.models.machine import Machine  # noqa: F401
from app.models.tag import Tag  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.services.channel_service import ChannelService


def test_stale_first():
    print("=" * 60)
    print("测试冷门优先（超过30天未出货优先）排序策略")
    print("=" * 60)

    db = SessionLocal()
    try:
        service = ChannelService(db)

        for tag_id in range(1, 5):
            print(f"\n--- 标签 ID = {tag_id} 的可用货道（冷门优先排序）---")
            channels = service.list_available_channels_by_tag_stale_first(
                machine_id=1, tag_id=tag_id, stale_days=30
            )

            if not channels:
                print("  (无可用货道)")
                continue

            now = datetime.now()
            for idx, ch in enumerate(channels[:5]):
                tag_name = ch.tag.name if ch.tag else "-"
                days_since_dispense = "-"
                stale_mark = ""

                if ch.last_dispense_at:
                    days = (now - ch.last_dispense_at).days
                    days_since_dispense = f"{days}天前"
                    if days > 30:
                        stale_mark = " ⭐ 冷门(>30天)"
                else:
                    stale_mark = " ⭐ 从未出货(优先)"

                print(
                    f"  {idx+1}. 货道={ch.channel_code} | 标签={tag_name} | "
                    f"库存={ch.stock} | 上次出货={days_since_dispense}{stale_mark}"
                )

        print("\n" + "=" * 60)
        print("排序规则验证：")
        print("  1. ⭐ 从未出货或超过30天未出货的货道排在最前面")
        print("  2. 同级别下，入库时间更早的优先")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    test_stale_first()
