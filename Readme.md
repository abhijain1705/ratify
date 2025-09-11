# RATIFY

Open-source platform to securely manage & monitor cloud workloads (AWS, Azure, GCP) with a unified frontend (React) and backend (FastAPI).

## Monorepo Structure

```
/
├── frontend/   # React app
├── backend/    # FastAPI app
├── .github/    # GitHub workflows, templates
├── .gitignore
├── README.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
```

## Features

- **Frontend:** Modern React dashboard for cloud analytics, scaling, cost optimization.
- **Backend:** FastAPI APIs for cloud connector management, monitoring, scaling, security.
- **Multi-cloud:** AWS, GCP, Azure connectors.
- **Security:** Firebase authentication, secrets encrypted (Fernet), IAM, firewall, DDoS.
- **Cost Dashboard:** Real-time billing, forecasting.
- **AI/ML:** Predictive scaling.

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/abhijain1705/ratify.git
cd ratify
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```
*Never commit real secrets; always use `.env` files!*

### 2. Install Dependencies

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Run Locally

#### Backend (FastAPI)
```bash
cd backend
uvicorn app:app --reload
```

#### Frontend (React)
```bash
cd frontend
npm run dev
```

Access frontend at [http://localhost:3000](http://localhost:3000)  
Backend API at [http://localhost:8000](http://localhost:8000)

### 4. Docker (optional)

See `frontend/Dockerfile` and `backend/Dockerfile` for containerization.

## Environment Variables

- See `frontend/.env.example`, `backend/.env.example` for required variables.
- **Never hard-code secrets.**

## Adding New Cloud Connectors

- **Backend:**  
  Add new connector modules in `backend/clouds/` and register endpoints in `backend/app.py`.
- **Frontend:**  
  Add new views/components in `frontend/src/pages/` and update API calls.

## Testing & Linting

#### Backend
```bash
pytest
flake8 backend/
```

#### Frontend
```bash
npm run test
npm run lint
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

> _Made with ❤️ at Hackathon 2025. Empowering the cloud, one dashboard at a time._

## 👥 Collaborators

- [Divyansh7agl](https://github.com/Divyansh7agl)
- [Aaradhya1702](https://github.com/Aaradhya1702)
- [abhijain1705](https://github.com/abhijain1705)