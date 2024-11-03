from app.celery.celery import celery_app
from app.db.engine import engine
from sqlmodel import Session, select
from app.models.project import Project
from celery import chain, group
import time

session = Session(engine)


@celery_app.task
def update_project_name(project_id):
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).one_or_none()
    project.name = "Celery updated name"
    session.add(project)
    session.commit()
    session.refresh(project)
    project = update_project_settings.delay(project_id).get(disable_sync_subtasks=False)
    res = group(add.s(4,4), add.s(8,8), add.s(16,16))()
    while res.completed_count() < 3:
        print('completed_count', res.completed_count())
        time.sleep(1)
    print('completed_count', res.completed_count())
    print(res.get(disable_sync_subtasks=False))
    return project


@celery_app.task
def update_project_settings(project_id):
    statement = select(Project).where(Project.id == project_id)
    project = session.exec(statement).one_or_none()
    project.sleep_seconds_between_page_scrape = 999
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@celery_app.task
def add(x, y):
    return x + y
