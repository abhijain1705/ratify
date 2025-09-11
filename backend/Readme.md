# Multi-Cloud Manager

Open-source FastAPI platform to securely manage & monitor workloads across AWS, Azure, and GCP.

## Features

- 🔗 Connect multiple cloud providers (AWS, GCP, Azure)
- 📊 Real-time workload monitoring (CPU, Memory, Network)
- 🚀 Auto-scale & self-heal applications
- 🔒 Automated security (firewall, IAM, DDoS protection)
- 💸 Cost optimization dashboard (billing & forecasting)
- 🤖 Predictive scaling via AI/ML

## Hackathon Demo

See `/api` endpoints in [app/main.py](app/main.py).  
Demo scripts and mock data available in `/tests`.

## Quick Start

### 1. Setup

- Install [Python 3.10+](https://www.python.org/downloads/)
- Clone repo:  
  ```bash
  git clone https://github.com/abhijain1705/multi-cloud-manager.git
  cd multi-cloud-manager
  ```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill your secrets:
```bash
cp .env.example .env
```
**Never commit `.env` or real secrets!**

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Locally

```bash
uvicorn app.main:app --reload
```
App runs at [http://localhost:8000](http://localhost:8000)

### 5. Docker (Optional)

```bash
docker build -t multi-cloud-manager .
docker run --env-file .env -p 8000:8000 multi-cloud-manager
```

## Adding a Cloud Connector

- Create a new file in `app/api/` (e.g., `azure.py`)
- Implement endpoints and register with `main.py`
- Update documentation for new endpoints

## Running Tests & Linting

```bash
pytest
```

Linting (optional):
```bash
pip install flake8
flake8 app/
```