import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy import text
from app.db.database import engine


def migrate():
    print("开始迁移：添加 stock_in_at 列和初始化冷门数据...")

    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE channels ADD COLUMN stock_in_at DATETIME"))
            conn.commit()
            print("  ✓ 添加 stock_in_at 列成功")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("  - stock_in_at 列已存在，跳过")
            else:
                raise

        result = conn.execute(text("SELECT id, created_at FROM channels"))
        rows = result.fetchall()

        now = datetime.now()
        stale_threshold = now - timedelta(days=60)
        stale_threshold_str = stale_threshold.strftime("%Y-%m-%d %H:%M:%S")

        stale_count = 0
        updated_stock_in = 0

        for idx, (channel_id, created_at) in enumerate(rows):
            conn.execute(
                text("UPDATE channels SET stock_in_at = :stock_in_at WHERE id = :id AND stock_in_at IS NULL"),
                {"stock_in_at": created_at, "id": channel_id}
            )
            updated_stock_in += 1

            if idx < len(rows) // 3:
                conn.execute(
                    text("UPDATE channels SET last_dispense_at = :last_dispense WHERE id = :id"),
                    {"last_dispense": stale_threshold_str, "id": channel_id}
                )
                stale_count += 1

        conn.commit()

        print(f"  ✓ 初始化 stock_in_at 数据：{updated_stock_in} 条")
        print(f"  ✓ 模拟冷门货道（last_dispense_at > 30天）：{stale_count} 条")
        print("\n迁移完成！")


if __name__ == "__main__":
    migrate()
