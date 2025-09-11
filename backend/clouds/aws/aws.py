import boto3
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
 
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
