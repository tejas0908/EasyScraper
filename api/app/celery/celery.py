from celery import Celery
import os

celery_app = Celery(
    "easyscraper",
    broker=os.environ["BROKER_URL"],
    backend=os.environ["RESULT_BACKEND"],
    include=["app.celery.tasks", "app.db.engine", "app.models.project", "app.util"],
)


class CeleryConfig:
    task_serializer = "pickle"
    result_serializer = "pickle"
    event_serializer = "json"
    accept_content = ["application/json", "application/x-python-serialize"]
    result_accept_content = ["application/json", "application/x-python-serialize"]


celery_app.config_from_object(CeleryConfig)

if __name__ == "__main__":
    celery_app.start()
