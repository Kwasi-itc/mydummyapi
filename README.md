# Fintech Agent API

A simple Node.js Express API with dummy fintech endpoints designed for intelligent agent chatbot workflows. This API provides mock endpoints for accounts, transactions, payments, loans, airtime purchases, KYC, and account limits - all without a database, using in-memory data stores.

## Features

- **No Database Required**: All data is stored in-memory
- **Checker Endpoints**: Special endpoints that return true/false for workflow dependencies
- **RESTful Design**: Standard HTTP methods (GET, POST, PATCH)
- **Workflow-Ready**: Responses include metadata useful for agent orchestration
- **Comprehensive Coverage**: Accounts, transactions, payments, loans, airtime, KYC, and limits

## Quick Start

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

### Health Check

```bash
curl http://localhost:3000/health
```

### Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response schemas
- Example payloads

Similar to FastAPI's `/docs` endpoint, you can test all endpoints directly from the browser.

## API Endpoints

### System

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00Z",
  "requestId": "req-1234567890-abc123"
}
```

---

### Core Accounts

#### `GET /accounts`
List all accounts with optional filters.

**Query Parameters:**
- `customerId` (optional) - Filter by customer ID
- `status` (optional) - Filter by status (active, suspended, closed)
- `type` (optional) - Filter by type (savings, current)
- `currency` (optional) - Filter by currency

**Example:**
```bash
curl http://localhost:3000/accounts?customerId=cust-001&status=active
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "acc-001",
      "customerId": "cust-001",
      "type": "savings",
      "currency": "GHS",
      "balance": 5000.00,
      "status": "active",
      "accountNumber": "1234567890",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-20T10:00:00Z",
  "requestId": "req-1234567890-abc123"
}
```

#### `GET /accounts/:accountId`
Get account details by ID.

#### `POST /accounts`
Create a new account.

**Request Body:**
```json
{
  "customerId": "cust-001",
  "type": "savings",
  "currency": "GHS",
  "initialDeposit": 1000.00,
  "kycLevel": "tier2"
}
```

#### `PATCH /accounts/:accountId/status`
Update account status.

**Request Body:**
```json
{
  "status": "suspended"
}
```

**Valid statuses:** `active`, `suspended`, `closed`

#### `POST /accounts/:accountId/check-active` ⚡ **Checker**
Verify if account is active.

**Response:**
```json
{
  "result": true,
  "reason": "Account is active",
  "metadata": {
    "accountId": "acc-001",
    "status": "active",
    "accountNumber": "1234567890"
  },
  "timestamp": "2024-01-20T10:00:00Z",
  "requestId": "req-1234567890-abc123"
}
```

---

### Transactions & Transfers

#### `GET /transactions`
List transactions with optional filters.

**Query Parameters:**
- `accountId` (optional) - Filter by account ID
- `status` (optional) - Filter by status (pending, cleared)
- `type` (optional) - Filter by type (debit, credit)
- `dateFrom` (optional) - Filter from date (ISO format)
- `dateTo` (optional) - Filter to date (ISO format)

#### `GET /transactions/:txnId`
Get transaction details by ID.

#### `POST /transactions`
Create a new transaction/transfer.

**Request Body:**
```json
{
  "fromAccount": "acc-001",
  "toAccount": "acc-002",
  "amount": 100.00,
  "currency": "GHS",
  "purpose": "Payment for services"
}
```

**Response:** Returns both debit and credit transactions.

#### `POST /transactions/:txnId/check-cleared` ⚡ **Checker**
Verify if transaction has been cleared.

**Response:**
```json
{
  "result": true,
  "reason": "Transaction has been cleared",
  "metadata": {
    "transactionId": "txn-001",
    "status": "cleared",
    "amount": 100.00,
    "currency": "GHS",
    "processedAt": "2024-01-18T09:05:00Z"
  }
}
```

---

### Payments & Payouts

#### `POST /payments/initiate`
Initiate a payment/payout.

**Request Body:**
```json
{
  "accountId": "acc-001",
  "beneficiary": "John Doe",
  "beneficiaryAccount": "9876543210",
  "amount": 200.00,
  "currency": "GHS",
  "method": "bank_transfer",
  "reference": "PAY-REF-001"
}
```

#### `GET /payments/:paymentId`
Get payment details by ID.

#### `POST /payments/:paymentId/cancel`
Cancel a pending payment.

#### `POST /payments/:paymentId/check-ready` ⚡ **Checker**
Verify if payment is ready to process.

**Response:**
```json
{
  "result": true,
  "reason": "Payment is ready to process",
  "metadata": {
    "paymentId": "pay-001",
    "status": "pending",
    "kycComplete": true,
    "sufficientBalance": true,
    "amount": 200.00,
    "currency": "GHS"
  }
}
```

---

### Loan Application Workflow

#### `POST /loans/apply`
Submit a loan application.

**Request Body:**
```json
{
  "customerId": "cust-001",
  "accountId": "acc-001",
  "amount": 5000.00,
  "purpose": "Business expansion",
  "tenure": 12,
  "collateral": "Property documents"
}
```

**Response:** Includes calculated interest rate and monthly payment.

#### `GET /loans/:loanId`
Get loan application details.

#### `GET /loans`
List loans with optional filters.

**Query Parameters:**
- `customerId` (optional) - Filter by customer ID
- `status` (optional) - Filter by status (pending, approved, rejected)
- `dateFrom` (optional) - Filter from date

#### `POST /loans/:loanId/check-eligible` ⚡ **Checker**
Verify loan eligibility.

**Response:**
```json
{
  "result": true,
  "reason": "Loan is eligible",
  "metadata": {
    "loanId": "loan-001",
    "creditScore": 750,
    "eligible": true,
    "amount": 5000.00,
    "status": "pending"
  }
}
```

#### `POST /loans/:loanId/check-approved` ⚡ **Checker**
Verify loan approval status.

**Response:**
```json
{
  "result": true,
  "reason": "Loan has been approved",
  "metadata": {
    "loanId": "loan-001",
    "status": "approved",
    "pendingChecks": [],
    "approvedAt": "2024-01-12T14:00:00Z"
  }
}
```

#### `POST /loans/:loanId/approve`
Approve a loan (admin action).

#### `POST /loans/:loanId/reject`
Reject a loan application.

**Request Body:**
```json
{
  "reason": "Insufficient credit score"
}
```

---

### Airtime Purchase

#### `GET /airtime/providers`
List available airtime providers/networks.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "MTN",
      "name": "MTN",
      "countries": ["GH", "NG", "ZA"]
    },
    {
      "id": "Vodafone",
      "name": "Vodafone",
      "countries": ["GH", "NG"]
    }
  ],
  "count": 5
}
```

#### `POST /airtime/purchase`
Purchase airtime.

**Request Body:**
```json
{
  "phoneNumber": "+233241234567",
  "amount": 10.00,
  "provider": "MTN",
  "currency": "GHS",
  "accountId": "acc-001"
}
```

#### `GET /airtime/purchases/:purchaseId`
Get airtime purchase details.

#### `GET /airtime/purchases`
List airtime purchases with optional filters.

**Query Parameters:**
- `accountId` (optional) - Filter by account ID
- `phoneNumber` (optional) - Filter by phone number
- `status` (optional) - Filter by status
- `dateFrom` (optional) - Filter from date

#### `POST /airtime/purchases/:purchaseId/check-completed` ⚡ **Checker**
Verify if airtime purchase is completed.

**Response:**
```json
{
  "result": true,
  "reason": "Airtime purchase has been completed",
  "metadata": {
    "purchaseId": "air-001",
    "status": "completed",
    "deliveryStatus": "delivered",
    "phoneNumber": "+233241234567",
    "amount": 10.00,
    "provider": "MTN",
    "completedAt": "2024-01-18T12:02:00Z"
  }
}
```

---

### Compliance & Risk (KYC)

#### `GET /kyc/customers/:customerId`
Get KYC status for a customer.

#### `POST /kyc/customers/:customerId/refresh`
Refresh KYC check.

**Request Body:**
```json
{
  "documents": ["id", "proof_of_address", "income_statement"],
  "level": "tier2"
}
```

#### `POST /kyc/customers/:customerId/check-approved` ⚡ **Checker**
Verify if KYC is approved.

**Response:**
```json
{
  "result": true,
  "reason": "KYC is approved",
  "metadata": {
    "customerId": "cust-001",
    "status": "approved",
    "level": "tier2",
    "riskRating": "low",
    "pendingItems": [],
    "verifiedAt": "2024-01-05T10:00:00Z",
    "expiresAt": "2025-01-05T10:00:00Z"
  }
}
```

---

### Workflow Utilities (Limits)

#### `GET /limits/:accountId`
Get account limits.

**Response:**
```json
{
  "status": "success",
  "data": {
    "accountId": "acc-001",
    "dailyLimit": 1000.00,
    "monthlyLimit": 10000.00,
    "dailyUsed": 250.00,
    "monthlyUsed": 1200.00,
    "currency": "GHS",
    "dailyRemaining": 750.00,
    "monthlyRemaining": 8800.00,
    "dailyAvailable": true,
    "monthlyAvailable": true,
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### `POST /limits/:accountId/update`
Update account limits.

**Request Body:**
```json
{
  "dailyLimit": 2000.00,
  "monthlyLimit": 20000.00
}
```

#### `POST /limits/:accountId/check-available` ⚡ **Checker**
Verify if limit is available for a transaction.

**Request Body:**
```json
{
  "amount": 500.00,
  "period": "daily"
}
```

**Response:**
```json
{
  "result": true,
  "reason": "Daily limit available: 750 GHS",
  "metadata": {
    "accountId": "acc-001",
    "period": "daily",
    "requestedAmount": 500.00,
    "remaining": 750.00,
    "limit": 1000.00,
    "used": 250.00,
    "currency": "GHS"
  }
}
```

---

## Checker Endpoints Pattern

All checker endpoints follow a consistent pattern:

- **Method:** POST
- **Response Format:**
  ```json
  {
    "result": true | false,
    "reason": "Human-readable explanation",
    "metadata": { /* Additional context */ },
    "timestamp": "ISO timestamp",
    "requestId": "Unique request ID"
  }
  ```

Checker endpoints are designed for workflow conditional logic. An intelligent agent can use them to:
- Verify prerequisites before executing actions
- Check status before proceeding to next step
- Validate conditions for workflow branching

---

## Workflow Examples

### Example 1: Payment Workflow

An agent workflow for processing a payment:

1. **Check account is active:**
   ```bash
   POST /accounts/acc-001/check-active
   ```

2. **Check KYC is approved:**
   ```bash
   POST /kyc/customers/cust-001/check-approved
   ```

3. **Check limit is available:**
   ```bash
   POST /limits/acc-001/check-available
   Body: { "amount": 200.00, "period": "daily" }
   ```

4. **If all checks pass, initiate payment:**
   ```bash
   POST /payments/initiate
   Body: { "accountId": "acc-001", "beneficiary": "...", ... }
   ```

5. **Check payment is ready:**
   ```bash
   POST /payments/pay-001/check-ready
   ```

### Example 2: Loan Application Workflow

1. **Submit loan application:**
   ```bash
   POST /loans/apply
   ```

2. **Check eligibility:**
   ```bash
   POST /loans/loan-001/check-eligible
   ```

3. **If eligible, check KYC:**
   ```bash
   POST /kyc/customers/cust-001/check-approved
   ```

4. **If KYC approved, approve loan:**
   ```bash
   POST /loans/loan-001/approve
   ```

5. **Verify approval:**
   ```bash
   POST /loans/loan-001/check-approved
   ```

### Example 3: Airtime Purchase Workflow

1. **Get available providers:**
   ```bash
   GET /airtime/providers
   ```

2. **Purchase airtime:**
   ```bash
   POST /airtime/purchase
   Body: { "phoneNumber": "+233241234567", "amount": 10.00, ... }
   ```

3. **Check completion:**
   ```bash
   POST /airtime/purchases/air-001/check-completed
   ```

---

## Response Format

All endpoints return a consistent response structure:

**Success Response:**
```json
{
  "status": "success",
  "data": { /* Response data */ },
  "timestamp": "2024-01-20T10:00:00Z",
  "requestId": "req-1234567890-abc123"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-20T10:00:00Z",
  "requestId": "req-1234567890-abc123"
}
```

---

## Data Persistence

⚠️ **Important:** This API uses in-memory data stores. All data is lost when the server restarts. This is intentional for a dummy/mock API designed for testing and development.

---

## Project Structure

```
.
├── src/
│   ├── server.js           # Main Express server
│   ├── data/
│   │   └── mockData.js     # In-memory data stores
│   └── routes/
│       ├── accounts.js      # Account endpoints
│       ├── transactions.js # Transaction endpoints
│       ├── payments.js      # Payment endpoints
│       ├── loans.js        # Loan endpoints
│       ├── airtime.js      # Airtime endpoints
│       ├── kyc.js          # KYC endpoints
│       └── limits.js       # Limits endpoints
├── package.json
└── README.md
```

---

## License

ISC

