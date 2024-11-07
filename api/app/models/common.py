from pydantic import BaseModel


class FastAPIError(BaseModel):
    detail: str
