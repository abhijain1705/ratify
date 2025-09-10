import boto3
from botocore.exceptions import ClientError

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


def get_cpu_utilization(access_key, secret_key, region, instance_id):
    cloudwatch = boto3.client(
        "cloudwatch",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )
    response = cloudwatch.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime="2025-09-09T00:00:00Z",
        EndTime="2025-09-10T00:00:00Z",
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
