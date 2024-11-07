from pydantic import BaseModel


class FastAPIError(BaseModel):
    detail: str


class IdResponse(BaseModel):
    id: str


class Paging(BaseModel):
    skip: int
    limit: int
