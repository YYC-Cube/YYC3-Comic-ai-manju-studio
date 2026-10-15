# ==============================================================
# YYC³ 漫剧生产系统 · core/database —— 持久化层（M5 切库启用）
# M5：路由层三处内存承载（分镜注册表 / 项目登记 / 任务登记）切数据库——
#   本地默认仓内 SQLite 文件（config 推导，零配置可跑）；部署态 env DATABASE_URL
#   覆盖为 PG（同一 SQLAlchemy Core 表抽象屏蔽方言；JSON 文档以 TEXT 列承载，
#   PG 侧如需 JSONB 查询再迁移，当前访问模式为整取/整存无字段级查询需求）
# 表：storyboards（分镜文档）/ projects（项目登记）/ task_registry（任务登记）
# 健康探测：ok / error（database_url 恒有值——M5 起无 skipped 态）
# ==============================================================
import json
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings

_engine: Any = None
_meta: Any = None
_tables: dict[str, Any] = {}


def get_engine() -> Any:
    """惰性创建 SQLAlchemy 引擎（pool_pre_ping 探活）。"""
    global _engine
    if _engine is not None:
        return _engine
    from sqlalchemy import create_engine  # noqa: PLC0415

    url = get_settings().database_url
    if url.startswith("sqlite"):
        # SQLite：保证父目录存在；check_same_thread=False 供 FastAPI 多线程路由复用
        from pathlib import Path  # noqa: PLC0415

        Path(url.replace("sqlite:///", "")).parent.mkdir(parents=True, exist_ok=True)
        _engine = create_engine(url, pool_pre_ping=True, connect_args={"check_same_thread": False})
    else:
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


def _table(name: str) -> Any:
    """惰性定义并缓存 Core 表对象（首次访问触发建表）。"""
    if name in _tables:
        return _tables[name]
    global _meta
    from sqlalchemy import Column, Integer, MetaData, Table, Text  # noqa: PLC0415

    if _meta is None:
        _meta = MetaData()
    specs = {
        # 分镜文档注册表：key = "{project_id}:{episode_id}"，doc = StoryboardV1 JSON
        "storyboards": [
            Column("key", Text, primary_key=True),
            Column("doc", Text, nullable=False),
            Column("updated_at", Text, nullable=False),
        ],
        # 项目登记：seq 自增（proj-NNNN 序号源），doc = Project JSON
        "projects": [
            Column("seq", Integer, primary_key=True, autoincrement=True),
            Column("project_id", Text, nullable=False, unique=True),
            Column("doc", Text, nullable=False),
            Column("created_at", Text, nullable=False),
        ],
        # 任务入队登记：seq 自增（倒序取近 50 条）
        "task_registry": [
            Column("seq", Integer, primary_key=True, autoincrement=True),
            Column("task_id", Text, nullable=False),
            Column("task_type", Text, nullable=False),
            Column("status", Text, nullable=False),
            Column("created_at", Text, nullable=False),
        ],
    }
    if name not in specs:
        raise KeyError(f"未登记的表：{name}")
    tbl = Table(name, _meta, *specs[name])
    _tables[name] = tbl
    init_schema()
    return tbl


def init_schema() -> None:
    """建表（幂等，create_all checkfirst）；对已注册表统一执行。"""
    if _meta is not None and _tables:
        _meta.create_all(get_engine())


def init_all() -> None:
    """启动期显式注册并建全部表（幂等）；路由首次访问亦会惰性补建。"""
    for name in ("storyboards", "projects", "task_registry"):
        _table(name)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------
# 分镜注册表（storyboard.py 消费）
# --------------------------------------------------------------
def load_storyboard(key: str) -> dict | None:
    from sqlalchemy import select  # noqa: PLC0415

    tbl = _table("storyboards")
    with get_engine().connect() as conn:
        row = conn.execute(select(tbl.c.doc).where(tbl.c.key == key)).first()
    return json.loads(row[0]) if row else None


def save_storyboard(key: str, doc: dict) -> None:
    """整存（UPSERT 语义）；读写同事务单连接，避免 SQLite 写锁竞争。"""
    from sqlalchemy import insert, select  # noqa: PLC0415

    tbl = _table("storyboards")
    payload_doc = json.dumps(doc, ensure_ascii=False)
    with get_engine().begin() as conn:
        exists = conn.execute(select(tbl.c.key).where(tbl.c.key == key)).first()
        if exists:
            conn.execute(
                tbl.update().where(tbl.c.key == key).values(doc=payload_doc, updated_at=_now())
            )
        else:
            conn.execute(insert(tbl).values(key=key, doc=payload_doc, updated_at=_now()))


# --------------------------------------------------------------
# 项目登记（project.py 消费）
# --------------------------------------------------------------
def next_project_seq() -> int:
    from sqlalchemy import func, select  # noqa: PLC0415

    tbl = _table("projects")
    with get_engine().connect() as conn:
        n = conn.execute(select(func.count(tbl.c.seq))).scalar() or 0
    return n + 1


def insert_project(project_id: str, doc: dict) -> None:
    from sqlalchemy import insert  # noqa: PLC0415

    tbl = _table("projects")
    with get_engine().begin() as conn:
        conn.execute(
            insert(tbl).values(
                project_id=project_id, doc=json.dumps(doc, ensure_ascii=False), created_at=_now()
            )
        )


def list_projects() -> list[dict]:
    from sqlalchemy import select  # noqa: PLC0415

    tbl = _table("projects")
    with get_engine().connect() as conn:
        rows = conn.execute(select(tbl.c.doc).order_by(tbl.c.seq)).all()
    return [json.loads(r[0]) for r in rows]


def load_project(project_id: str) -> dict | None:
    from sqlalchemy import select  # noqa: PLC0415

    tbl = _table("projects")
    with get_engine().connect() as conn:
        row = conn.execute(select(tbl.c.doc).where(tbl.c.project_id == project_id)).first()
    return json.loads(row[0]) if row else None


# --------------------------------------------------------------
# 任务登记（task.py 消费）
# --------------------------------------------------------------
def insert_task_record(task_id: str, task_type: str, status: str) -> None:
    from sqlalchemy import insert  # noqa: PLC0415

    tbl = _table("task_registry")
    with get_engine().begin() as conn:
        conn.execute(
            insert(tbl).values(task_id=task_id, task_type=task_type, status=status, created_at=_now())
        )


def list_recent_tasks(limit: int = 50) -> list[dict]:
    from sqlalchemy import select  # noqa: PLC0415

    tbl = _table("task_registry")
    with get_engine().connect() as conn:
        rows = conn.execute(
            select(tbl.c.task_id, tbl.c.task_type, tbl.c.status, tbl.c.created_at)
            .order_by(tbl.c.seq.desc())
            .limit(limit)
        ).all()
    return [
        {"task_id": r[0], "task_type": r[1], "status": r[2], "created_at": r[3]}
        for r in reversed(rows)
    ]


def health() -> str:
    """健康探测：ok / error（M5 起 database_url 恒有值，无 skipped 态）。"""
    try:
        with get_engine().connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return "ok"
    except Exception:
        return "error"
