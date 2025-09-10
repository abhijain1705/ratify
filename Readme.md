# Smart Multi-Cloud Resource Manager 🚀  
*One dashboard to master your cloud – automate, optimize, and predict across providers.*

---

## 🧐 Overview

**Smart Multi-Cloud Resource Manager** is an open-source platform to simplify multi-cloud operations for developers and teams.  
It empowers you to monitor, self-heal, predict resource needs, optimize costs, and automate security across your cloud infrastructure – starting with AWS.

**Solves challenges like:**
- Fragmented cloud monitoring
- Manual scaling & recovery
- Cost overruns
- Security blind spots

---

## ✨ Key Features

- **Unified Monitoring:** Track EC2, S3, and more in real time.
- **Auto-Scaling:** Dynamically adjust resources based on demand.
- **Self-Healing:** Automated detection and restart of failed resources.
- **Security Automation:** Run regular IAM and resource security checks.
- **Cost Dashboard:** Visualize and analyze cloud spending.
- **AI-Powered Predictions:** Use Prophet for smart, predictive scaling recommendations.

---

## 🏗️ Architecture Diagram

> **Add your architecture diagram here:**  
> _`/docs/architecture.png`_

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/), Python
- **Cloud Automation:** [AWS SDK (boto3)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- **AI/ML:** [Prophet](https://facebook.github.io/prophet/)

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/abhijain1705/ratify.git
cd ratify
```

### 2. Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Run the App

**Start Backend (FastAPI):**
```bash
cd ../backend
uvicorn main:app --reload
```

**Start Frontend (React):**
```bash
cd ../frontend
npm start
```

---

## 🛡️ AWS Setup Guide

1. **Create an IAM User or Role with Least Privileges:**
   - Go to **IAM** in AWS Console.
   - Create a user or role for programmatic access.
   - Attach the following minimal policies:
     - `AmazonEC2ReadOnlyAccess`
     - `CloudWatchReadOnlyAccess`
     - `IAMReadOnlyAccess`
     - `AmazonS3ReadOnlyAccess`
   - Save the **Access Key ID** and **Secret Access Key**.

2. **Add Credentials:**
   - Store credentials securely in your backend environment:
     ```
     AWS_ACCESS_KEY_ID=your-access-key
     AWS_SECRET_ACCESS_KEY=your-secret-key
     AWS_DEFAULT_REGION=us-east-1
     ```
   - **Never commit secrets to source control!**

---

## 📈 Usage

1. **Connect Your AWS Account:**
   - Enter your AWS credentials in the backend `.env` file.

2. **Launch the Dashboard:**
   - Access real-time monitoring for EC2, S3, and IAM resources.

3. **Explore Predictive Scaling:**
   - View AI-driven forecasts for future resource needs.
   - Review scaling recommendations and cost projections.

---

## 🛤️ Roadmap

- [x] AWS support: monitoring, auto-scaling, prediction
- [ ] Google Cloud Platform (GCP) integration
- [ ] Microsoft Azure integration
- [ ] Multi-cloud cost optimization
- [ ] Advanced anomaly detection (AI/ML)

---

## 🤝 Contributing

We welcome all contributions! To get started:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a [pull request](https://github.com/abhijain1705/ratify/pulls).

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> _Made with ❤️ at Hackathon 2025. Empowering the cloud, one dashboard at a time._

## 👥 Collaborators

- [Divyansh7agl](https://github.com/Divyansh7agl)
- [Aaradhya1702](https://github.com/Aaradhya1702)
- [abhijain1705](https://github.com/abhijain1705)