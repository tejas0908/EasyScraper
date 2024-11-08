from sqlmodel import create_engine, SQLModel, Session
import os
import app.models.auth
import app.models.project
import app.models.page_template
import app.models.scrape_rule
import app.models.ai_prompt
import app.models.seed_page
from typing import Annotated
from fastapi import Depends

db_url = os.environ["DB_URL"]
engine = create_engine(db_url, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]

SQLModel.metadata.create_all(engine)
