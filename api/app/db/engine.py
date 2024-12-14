import os
from typing import Annotated

import app.models.auth
import app.models.page_template
import app.models.project
import app.models.scrape_rule
import app.models.scrape_run
import app.models.seed_page
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

db_url = os.environ["DB_URL"]
engine = create_engine(db_url, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
