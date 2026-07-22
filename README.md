# SIDP — Secure Interoperable Digital Banking Platform

A working prototype of a secure digital banking ecosystem built to demonstrate cryptographic device-bound authentication, cross-institution payment routing, and automated net settlement.

Built by **Sangwani Phiri** — BSc Computer Science, University of Malawi.

---

## What This System Does

SIDP addresses two confirmed problems in Malawi's digital financial ecosystem:

**Problem 1 — SIM Swap Fraud**
Current digital banking platforms authenticate the SIM card, not the person. An attacker who performs a SIM swap receives all OTPs sent to the victim's number and gains full account access. SIDP eliminates OTP-based authentication entirely, replacing it with cryptographic device-bound identity.

**Problem 2 — Fragmented Payment Ecosystems**
Different financial institutions operate separate, siloed systems. SIDP demonstrates a unified payment routing layer that allows seamless cross-institution transactions between banks and mobile money operators, with automated end-of-day net settlement.

---

## How the Authentication Works

When a user registers their device, the application generates a cryptographic key pair using the Web Crypto API directly in the browser. The private key is stored in the browser's non-exportable key store — it cannot be read, copied, or transmitted by any code. Only the public key is sent to the backend server.

When a transaction is initiated, the client requests a one-time nonce from the server, constructs a transaction payload, and signs it using the stored private key. The backend verifies the signature against the stored public key before any funds move. An attacker who performs a SIM swap and obtains the victim's phone number gains nothing — without the private key on the registered device, no transaction can be signed, and no transaction will be approved.

---

## Three Portals

The system has three role-based portals that tell the complete story in a live demo:

**Customer Portal** — Register a device, view accounts across institutions, send payments, see transaction history, and run the SIM swap attack simulator.

**Bank Operator Portal** — View institution-specific transaction data and deposits. NBM sees NBM data, not the full system.

**RBM Portal** — System-wide oversight. All transactions, deposits broken down by institution, and the settlement engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python, FastAPI |
| Database | PostgreSQL |
| ORM and Migrations | SQLAlchemy, Alembic |
| Frontend | React, Vite |
| Cryptography | Web Crypto API (ECDSA P-256) |
| Authentication | JWT, bcrypt |
| Key Storage | IndexedDB (non-exportable) |

---

## Demo Credentials

All demo accounts use password: `demo1234`

| Role | Email |
|---|---|
| Customer | john@sidp.demo |
| Customer | grace@sidp.demo |
| NBM Operator | nbm@sidp.demo |
| Airtel Operator | airtel@sidp.demo |
| RBM Admin | rbm@sidp.demo |

---

## Installation and Setup

### Requirements

- Python 3.10+
- PostgreSQL
- Node.js 18+

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a PostgreSQL database:

```sql
CREATE DATABASE sidp_db;
CREATE USER sidp_user WITH PASSWORD 'sidp_dev_pass123';
GRANT ALL PRIVILEGES ON DATABASE sidp_db TO sidp_user;
```

Create a `.env` file in the backend folder:

```env
APP_NAME=SIDP Banking Platform
APP_VERSION=1.0.0
DEBUG=True
DATABASE_URL=postgresql://sidp_user:sidp_dev_pass123@localhost:5432/sidp_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Run migrations and seed demo data:

```bash
alembic upgrade head
python3 seed_institutions.py
python3 seed_demo.py
```

Start the backend:

```bash
python run.py
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Project Structure

```
sidp/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request and response schemas
│   │   ├── services/      # Business logic layer
│   │   ├── utils/         # Auth dependencies and helpers
│   │   ├── config.py      # Environment configuration
│   │   ├── database.py    # Database connection
│   │   └── main.py        # FastAPI application entry point
│   ├── alembic/           # Database migrations
│   ├── seed_institutions.py
│   ├── seed_demo.py
│   ├── requirements.txt
│   └── run.py
└── frontend/
    └── src/
        ├── api/           # Axios API clients
        ├── context/       # React auth context
        ├── pages/
        │   ├── customer/  # Customer portal pages
        │   ├── bank/      # Bank operator portal pages
        │   └── rbm/       # RBM regulator portal pages
        └── utils/         # Crypto, formatters
```

---

## Security Features Demonstrated

| Attack | Defense |
|---|---|
| SIM Swap | No OTP in the system. Private key never leaves registered device. |
| Credential Theft | Password alone authorises nothing. Every transaction requires a device signature. |
| Replay Attack | Server-issued nonce consumed on use. Resubmitting a signed transaction is rejected. |
| Payload Tampering | Signature covers the full payload. Any modification invalidates the signature. |
| Stolen Device | User can revoke device remotely. Revocation immediately invalidates the public key. |

---

## Team

Built by RamTech — University of Malawi, 2025.

| Name | Role |
|---|---|
| Sangwani Phiri | Lead Developer |

---

*This is a research prototype. It is not intended for production use.*
