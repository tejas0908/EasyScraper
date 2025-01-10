import os
import shutil
import tempfile
import pathlib


class FSBlobStore:
    def __init__(self):
        self.root_path = os.environ["FS_PATH"]
        pass

    def download_file(self, file_url: str) -> str:
        object_name = file_url.split("/")[-1]
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, object_name)
        blob_file_path = f"{self.root_path}/{file_url}"
        shutil.copyfile(blob_file_path, temp_path)
        return temp_path

    def download_folder(self, folder_url: str) -> str:
        return None

    def upload_file(self, local_file_path: str, remote_file_path: str) -> str:
        blob_file_path = f"{self.root_path}/{remote_file_path}"
        os.makedirs(os.path.dirname(blob_file_path), exist_ok=True)
        shutil.copyfile(local_file_path, blob_file_path)
        return remote_file_path
