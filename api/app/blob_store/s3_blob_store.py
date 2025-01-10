import os
import tempfile

import boto3
from botocore.client import Config
from botocore.exceptions import NoCredentialsError


class S3BlobStore:
    def __init__(self):
        self.bucket = os.environ["S3_BUCKET"]
        self.endpoint_url = os.environ.get("S3_ENDPOINT_URL")
        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=os.environ.get("S3_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("S3_SECRET_ACCESS_KEY"),
            region_name=os.environ["S3_DEFAULT_REGION"],
            config=Config(signature_version="s3v4"),
        )

    def download_file(self, file_url: str) -> str:
        object_name = file_url.split("/")[-1]
        response = self.client.get_object(Bucket=self.bucket, Key=object_name)
        file_content = response["Body"].read()
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(file_content)
        temp_file.close()
        return temp_file.name

    def download_folder(self, folder_url: str) -> str:
        return None

    def upload_file(self, local_file_path: str, remote_file_path: str) -> str:
        try:
            self.client.upload_file(local_file_path, self.bucket, remote_file_path)
            url = f"{self.endpoint_url}/{self.bucket}/{remote_file_path}"
            return url
        except FileNotFoundError:
            print("The file was not found")
            return None
        except NoCredentialsError:
            print("Credentials not available")
            return None
