import boto3
import math
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

def get_ec2_client(access_key, secret_key, region):
    return boto3.client(
        "ec2",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )

def get_rds_metrics(access_key, secret_key, region, db_instance_id, start, end):
    cw = boto3.client(
        "cloudwatch",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )

    MAX_DATAPOINTS = 1440
    total_seconds = int((end - start).total_seconds())
    period = max(60, math.ceil(total_seconds / MAX_DATAPOINTS))  # minimum period is 60 seconds

    resp = cw.get_metric_statistics(
        Namespace="AWS/RDS",
        MetricName="CPUUtilization",
        Dimensions=[
            {"Name": "DBInstanceIdentifier", "Value": db_instance_id},
        ],
        StartTime=start,
        EndTime=end,
        Period=period,
        Statistics=["Average"]
    )

    return resp.get("Datapoints", [])

def get_s3_metrics(access_key, secret_key, region, bucket_name, start, end):
    cw = boto3.client(
        "cloudwatch",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    region_name=region
    )

    # Example: BucketSizeBytes (standard storage class)
    resp = cw.get_metric_statistics(
        Namespace="AWS/S3",
        MetricName="BucketSizeBytes",
        Dimensions=[
            {"Name": "BucketName", "Value": bucket_name},
            {"Name": "StorageType", "Value": "StandardStorage"},
        ],
        StartTime=start,
        EndTime=end,
        Period=86400,  # 1 day (S3 storage metrics are daily)
        Statistics=["Average"]
    )

    return resp.get("Datapoints", [])

 
def get_billing(access_key, secret_key, start, region="us-east-1", end=None):
    ce = boto3.client(
        "ce",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )
    now = datetime.utcnow()
    start = (start or (now - timedelta(days=30))).strftime("%Y-%m-%d")
    end = (end or now).strftime("%Y-%m-%d")

    response = ce.get_cost_and_usage(
        TimePeriod={"Start": start, "End": end},
        Granularity="DAILY",
        Metrics=["UnblendedCost"]
    )
    return response["ResultsByTime"]


def validate_aws_credentials(access_key, secret_key, region="us-east-1"):
    try:
        sts = boto3.client(
            "sts",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        identity = sts.get_caller_identity()
        return {"Account": identity["Account"], "Arn": identity["Arn"]}
    except ClientError as e:
        raise ValueError(f"Invalid AWS credentials: {e}")



def get_cpu_utilization(access_key, secret_key, region, instance_id, start=None, end=None):
    cloudwatch = boto3.client(
        "cloudwatch",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )

    end = end or datetime.utcnow()
    start = start or (end - timedelta(hours=1))

    response = cloudwatch.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=["Average"]
    )
    return response["Datapoints"]


def set_asg_capacity(access_key, secret_key, region, asg_name, desired_capacity):
    autoscaling = boto3.client(
        "autoscaling",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )
    autoscaling.set_desired_capacity(
        AutoScalingGroupName=asg_name,
        DesiredCapacity=desired_capacity,
        HonorCooldown=False
    )
    return {"status": "scaled", "asg": asg_name, "capacity": desired_capacity}
