# ☕ CafeFlow - Complete Setup & Execution Guide

CafeFlow is a full-stack Cafe Management System with a Spring Boot backend, PostgreSQL database, and two Vite + React frontends (Customer Portal & Admin Portal).

---

## ⚡ Quick Reference: How to Run in 4 Steps

Run the following commands in order across separate terminal windows:

```
[ Step 1: Database ]  --->  [ Step 2: Backend ]  --->  [ Step 3: Customer App ]  --->  [ Step 4: Admin App ]
  docker-compose up           mvn spring-boot:run             npm run dev                 npm run dev
```

---

## 🔐 System Logins & URLs

| Application | URL | Access / Credentials |
| :--- | :--- | :--- |
| **Customer App** | `http://localhost:5173` | Guest Checkout / Mobile Login |
| **Admin Portal** | `http://localhost:5174` | **Email**: `admin@cafeflow.com`<br>**Password**: `cafeflow@admin` |
| **Backend Service** | `http://localhost:8080` | REST API |
| **PostgreSQL Database** | `localhost:5433` | **User**: `postgres`, **Pass**: `password`, **DB**: `cafeflow` |

---

## 🚀 Detailed Step-by-Step Execution Guide

### 📌 STEP 1: Start the PostgreSQL Database

Open **Terminal 1** in the project root directory (`CafeFlow`):

```bash
docker-compose up -d
```
> Starts PostgreSQL container `cafeflow-postgres` listening on port `5433`.

---

### 📌 STEP 2: Start the Backend Service (Spring Boot)

Open **Terminal 2** in the project root directory (`CafeFlow`):

#### 🪟 Windows (PowerShell / Command Prompt):
```powershell
cd backend
..\maven\apache-maven-3.9.6\bin\mvn spring-boot:run
```

#### 🐧 Linux / macOS / System Maven:
```bash
cd backend
mvn spring-boot:run
```
> The backend will start on `http://localhost:8080` and run all database migrations automatically via Flyway.

---

### 📌 STEP 3: Start the Customer App (Frontend)

Open **Terminal 3** in the project root directory (`CafeFlow`):

```bash
cd customer-app
npm install
npm run dev
```
> Launches the Customer Web Application at **`http://localhost:5173`**.

---

### 📌 STEP 4: Start the Admin App (Frontend)

Open **Terminal 4** in the project root directory (`CafeFlow`):

```bash
cd admin-app
npm install
npm run dev
```
> Launches the Admin Portal & Kitchen Display System at **`http://localhost:5174`**.

---

## 🧪 Production Build Commands

If you need to generate production release bundles:

### 1. Build Backend JAR:
```powershell
cd backend
..\maven\apache-maven-3.9.6\bin\mvn clean package -DskipTests
```

### 2. Build Customer App:
```bash
cd customer-app
npm run build
```

### 3. Build Admin App:
```bash
cd admin-app
npm run build
```

---

## 🛠️ Notes & Credentials

- **Admin Account**: Use `admin@cafeflow.com` with password `cafeflow@admin`.
- **Customer Checkout**: Supports both **Guest Checkout** (no login required) and **Mobile Number Registration**.
