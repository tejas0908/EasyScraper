import os
from app.blob_store.s3_blob_store import S3BlobStore
from app.blob_store.fs_blob_store import FSBlobStore


def get_blob_store():
    blob_store_type = os.environ["BLOB_STORE"]
    if blob_store_type == "s3":
        return S3BlobStore()
    elif blob_store_type == "fs":
        return FSBlobStore()
    return None


blob_store = get_blob_store()
