import boto3
import math
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

def validate_aws_credentials(access_key, secret_key, region="us-east-1"): 
    try: 
        sts = boto3.client( "sts", aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region )
        identity = sts.get_caller_identity() 
        return {"Account": identity["Account"], "Arn": identity["Arn"]} 
    except ClientError as e: 
        raise ValueError(f"Invalid AWS credentials: {e}")

# -----------------------------
# Utility: Decide Granularity
# -----------------------------
def decide_granularity(start: datetime, end: datetime):
    days = (end - start).days
    if days <= 7:
        return "DAILY"
    else:
        return "MONTHLY"

def decide_period(start: datetime, end: datetime):
    """Return CloudWatch period in seconds based on date range."""
    days = (end - start).days
    if days <= 7:
        return 300       # 5 min
    elif days <= 30:
        return 3600      # 1 hour
    else:
        return 86400     # 1 day

# -----------------------------
# EC2 Client
# -----------------------------
def get_ec2_client(access_key, secret_key, region):
    return boto3.client(
        "ec2",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )

# -----------------------------
# RDS Metrics
# -----------------------------
def get_rds_metrics(access_key, secret_key, region, db_instance_id, start, end):
    cw = boto3.client("cloudwatch",
                      aws_access_key_id=access_key,
                      aws_secret_access_key=secret_key,
                      region_name=region)

    period = decide_period(start, end)

    resp = cw.get_metric_statistics(
        Namespace="AWS/RDS",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "DBInstanceIdentifier", "Value": db_instance_id}],
        StartTime=start,
        EndTime=end,
        Period=period,
        Statistics=["Average"]
    )
    return resp.get("Datapoints", [])

# -----------------------------
# S3 Metrics
# -----------------------------
def get_s3_metrics(access_key, secret_key, region, bucket_name, start, end):
    cw = boto3.client("cloudwatch",
                      aws_access_key_id=access_key,
                      aws_secret_access_key=secret_key,
                      region_name=region)

    period = decide_period(start, end)

    resp = cw.get_metric_statistics(
        Namespace="AWS/S3",
        MetricName="BucketSizeBytes",
        Dimensions=[
            {"Name": "BucketName", "Value": bucket_name},
            {"Name": "StorageType", "Value": "StandardStorage"},
        ],
        StartTime=start,
        EndTime=end,
        Period=period,
        Statistics=["Average"]
    )
    return resp.get("Datapoints", [])

# -----------------------------
# Billing (Cost Explorer)
# -----------------------------
def get_billing(access_key, secret_key, start, region="us-east-1", end=None):
    ce = boto3.client("ce",
                      aws_access_key_id=access_key,
                      aws_secret_access_key=secret_key,
                      region_name=region)

    # Normalize dates
    def normalize_date(date_input, default=None):
        if date_input is None:
            return default
        if isinstance(date_input, datetime):
            return date_input.strftime("%Y-%m-%d")
        try:
            parsed = datetime.fromisoformat(str(date_input).replace("Z", "+00:00"))
            return parsed.strftime("%Y-%m-%d")
        except Exception:
            return date_input

    now = datetime.utcnow()
    start_dt = datetime.fromisoformat(normalize_date(start, (now - timedelta(days=30)).strftime("%Y-%m-%d")))
    end_dt = datetime.fromisoformat(normalize_date(end, now.strftime("%Y-%m-%d")))

    # End is exclusive
    end_dt += timedelta(days=1)

    granularity = decide_granularity(start_dt, end_dt)

    response = ce.get_cost_and_usage(
        TimePeriod={"Start": start_dt.strftime("%Y-%m-%d"),
                    "End": end_dt.strftime("%Y-%m-%d")},
        Granularity=granularity,
        Metrics=["UnblendedCost"],
        GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}]
    )
    return response["ResultsByTime"]

# -----------------------------
# EC2 CPU
# -----------------------------
def get_cpu_utilization(access_key, secret_key, region, instance_id, start=None, end=None):
    cloudwatch = boto3.client("cloudwatch",
                              aws_access_key_id=access_key,
                              aws_secret_access_key=secret_key,
                              region_name=region)

    end = end or datetime.utcnow()
    start = start or (end - timedelta(hours=1))

    period = decide_period(start, end)

    response = cloudwatch.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=start,
        EndTime=end,
        Period=period,
        Statistics=["Average"]
    )
    return response["Datapoints"]

# -----------------------------
# AutoScaling
# -----------------------------
def set_asg_capacity(access_key, secret_key, region, asg_name, desired_capacity):
    autoscaling = boto3.client("autoscaling",
                               aws_access_key_id=access_key,
                               aws_secret_access_key=secret_key,
                               region_name=region)
    autoscaling.set_desired_capacity(
        AutoScalingGroupName=asg_name,
        DesiredCapacity=desired_capacity,
        HonorCooldown=False
    )
    return {"status": "scaled", "asg": asg_name, "capacity": desired_capacity}

# -----------------------------
# IAM Policies
# -----------------------------
def check_iam_policies(iam_client):
    warnings = []
    users = iam_client.list_users()["Users"]
    for u in users:
        policies = iam_client.list_attached_user_policies(UserName=u["UserName"])
        for p in policies["AttachedPolicies"]:
            if p["PolicyName"] == "AdministratorAccess":
                warnings.append(f"User {u['UserName']} has full admin access. Risky!")
    return warnings

# -----------------------------
# Security Groups
# -----------------------------
def check_security_groups(ec2_client):
    insecure = []
    groups = ec2_client.describe_security_groups()["SecurityGroups"]
    for sg in groups:
        for perm in sg.get("IpPermissions", []):
            for ip_range in perm.get("IpRanges", []):
                if ip_range["CidrIp"] == "0.0.0.0/0" and perm.get("FromPort") in [22, 3389]:
                    insecure.append({
                        "group": sg["GroupId"],
                        "port": perm["FromPort"],
                        "protocol": perm["IpProtocol"]
                    })
    return insecure
