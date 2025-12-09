import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from backend.config import settings
import uuid

class S3Service:
    def __init__(self):
        self._s3_client = None
        self.bucket_name = settings.ORACLE_BUCKET_NAME
    
    @property
    def s3_client(self):
        if self._s3_client is None:
            if not settings.ORACLE_NAMESPACE:
                raise ValueError("Oracle Cloud credentials not configured. Please set ORACLE_NAMESPACE, ORACLE_ACCESS_KEY, ORACLE_SECRET_KEY, and ORACLE_BUCKET_NAME.")
            endpoint_url = f"https://{settings.ORACLE_NAMESPACE}.compat.objectstorage.{settings.ORACLE_REGION}.oraclecloud.com"
            self._s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.ORACLE_ACCESS_KEY,
                aws_secret_access_key=settings.ORACLE_SECRET_KEY,
                region_name=settings.ORACLE_REGION,
                endpoint_url=endpoint_url
            )
        return self._s3_client

    def generate_presigned_upload_url(self, s3_key: str, content_type: str, expiration: int = 3600):
        try:
            # Use the exact s3_key provided (no UUID prefix)
            unique_key = s3_key
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=unique_key,
                Fields={"Content-Type": content_type},
                Conditions=[
                    {"Content-Type": content_type},
                    ["content-length-range", 0, 5368709120]
                ],
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            print(f"Error generating presigned upload URL: {e}")
            return None

    def generate_presigned_download_url(self, key: str, expiration: int = 3600):
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            print(f"Error generating presigned download URL: {e}")
            return None

    def list_objects(self, prefix: str = "", delimiter: str = None):
        try:
            params = {
                'Bucket': self.bucket_name,
                'Prefix': prefix
            }
            if delimiter:
                params['Delimiter'] = delimiter

            response = self.s3_client.list_objects_v2(**params)

            # Combine both regular contents and common prefixes (folders)
            contents = response.get('Contents', [])

            # If delimiter is used, add CommonPrefixes as separate objects with 'Prefix' field
            if delimiter and 'CommonPrefixes' in response:
                for common_prefix in response['CommonPrefixes']:
                    # Keep the 'Prefix' field so routes/files.py can distinguish folders
                    contents.append({
                        'Prefix': common_prefix['Prefix']
                    })

            return contents
        except ClientError as e:
            print(f"Error listing objects: {e}")
            return []

    def delete_object(self, key: str):
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except ClientError as e:
            print(f"Error deleting object: {e}")
            return False

    def copy_object(self, source_key: str, destination_key: str):
        try:
            copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
            self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=destination_key
            )
            return True
        except ClientError as e:
            print(f"Error copying object: {e}")
            return False

    def delete_multiple_objects(self, keys: list):
        try:
            objects = [{'Key': key} for key in keys]
            response = self.s3_client.delete_objects(
                Bucket=self.bucket_name,
                Delete={'Objects': objects}
            )
            return response
        except ClientError as e:
            print(f"Error deleting multiple objects: {e}")
            return None

    def create_folder(self, folder_marker_key: str):
        try:
            # Create an empty .keep file to represent the folder
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=folder_marker_key,
                Body=b''
            )
            return True
        except ClientError as e:
            print(f"Error creating folder: {e}")
            return False

s3_service = S3Service()