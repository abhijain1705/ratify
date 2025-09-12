# utils/azure_client.py
from azure.identity import ClientSecretCredential
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.costmanagement import CostManagementClient
from datetime import datetime, timedelta

def get_azure_vm_metrics(credential, subscription_id, resource_group, vm_name, metric_name="Percentage CPU"):
    monitor_client = MonitorManagementClient(credential, subscription_id)
    vm_resource_id = (
        f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Compute/virtualMachines/{vm_name}"
    )
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=1)
    timespan = f"{start_time.isoformat()}/{end_time.isoformat()}"
    metrics_data = monitor_client.metrics.list(
        vm_resource_id,
        timespan=timespan,
        interval="PT1M",
        metricnames=metric_name,
        aggregation="Average",
    )
    return [metric.as_dict() for metric in metrics_data.value]

def get_azure_storage_metrics(credential, subscription_id, resource_group, storage_account, metric_name="UsedCapacity"):
    monitor_client = MonitorManagementClient(credential, subscription_id)
    storage_resource_id = (
        f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Storage/storageAccounts/{storage_account}"
    )
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=1)
    timespan = f"{start_time.isoformat()}/{end_time.isoformat()}"
    metrics_data = monitor_client.metrics.list(
        storage_resource_id,
        timespan=timespan,
        interval="PT1H",
        metricnames=metric_name,
        aggregation="Average",
    )
    return [metric.as_dict() for metric in metrics_data.value]

def get_azure_billing(credential, subscription_id, start_date, end_date):
    cost_client = CostManagementClient(credential)
    scope = f"/subscriptions/{subscription_id}"
    query = {
        "type": "ActualCost",
        "timeframe": "Custom",
        "timePeriod": {
            "from": start_date,
            "to": end_date,
        },
        "dataset": {
            "granularity": "Daily",
            "aggregation": {"totalCost": {"name": "PreTaxCost", "function": "Sum"}},
        },
    }
    result = cost_client.query.usage(scope, query)
    return result