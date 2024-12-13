from typing import Literal

from pydantic import BaseModel


class FastAPIError(BaseModel):
    detail: str


class IdResponse(BaseModel):
    id: str


class Paging(BaseModel):
    skip: int
    limit: int


class PagingResponse(BaseModel):
    page: int
    limit: int
    next_page: bool
    total_pages: int
    total_records: int


class PagingWithSortRequest(BaseModel):
    page: int
    limit: int
    sort_field: str
    sort_direction: Literal["asc", "desc"]


async def paging_with_sort(page: int, limit: int, sort_field: str, sort_direction: str):
    return PagingWithSortRequest(
        page=page, limit=limit, sort_field=sort_field, sort_direction=sort_direction
    )
