import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fintech Agent API',
      version: '1.0.0',
      description: 'Dummy fintech API endpoints for intelligent agent chatbot workflows. All endpoints use in-memory data stores (no database required).',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'acc-001' },
            customerId: { type: 'string', example: 'cust-001' },
            type: { type: 'string', enum: ['savings', 'current'], example: 'savings' },
            currency: { type: 'string', example: 'GHS' },
            balance: { type: 'number', example: 5000.00 },
            status: { type: 'string', enum: ['active', 'suspended', 'closed'], example: 'active' },
            accountNumber: { type: 'string', example: '1234567890' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'txn-001' },
            accountId: { type: 'string', example: 'acc-001' },
            type: { type: 'string', enum: ['debit', 'credit'], example: 'debit' },
            amount: { type: 'number', example: 100.00 },
            currency: { type: 'string', example: 'GHS' },
            description: { type: 'string', example: 'Payment to merchant' },
            status: { type: 'string', enum: ['pending', 'cleared'], example: 'cleared' },
            counterparty: { type: 'string', example: 'merchant-123' },
            initiatedAt: { type: 'string', format: 'date-time' },
            processedAt: { type: 'string', format: 'date-time', nullable: true },
            reference: { type: 'string', example: 'REF-001' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pay-001' },
            accountId: { type: 'string', example: 'acc-001' },
            beneficiary: { type: 'string', example: 'John Doe' },
            beneficiaryAccount: { type: 'string', example: '9876543210' },
            amount: { type: 'number', example: 200.00 },
            currency: { type: 'string', example: 'GHS' },
            method: { type: 'string', example: 'bank_transfer' },
            status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], example: 'completed' },
            reference: { type: 'string', example: 'PAY-REF-001' },
            initiatedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            kycComplete: { type: 'boolean', example: true },
            sufficientBalance: { type: 'boolean', example: true }
          }
        },
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'loan-001' },
            customerId: { type: 'string', example: 'cust-001' },
            accountId: { type: 'string', example: 'acc-001' },
            amount: { type: 'number', example: 5000.00 },
            currency: { type: 'string', example: 'GHS' },
            purpose: { type: 'string', example: 'Business expansion' },
            tenure: { type: 'integer', example: 12 },
            interestRate: { type: 'number', example: 8.5 },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
            creditScore: { type: 'integer', example: 750 },
            eligible: { type: 'boolean', example: true },
            appliedAt: { type: 'string', format: 'date-time' },
            approvedAt: { type: 'string', format: 'date-time', nullable: true },
            disbursedAt: { type: 'string', format: 'date-time', nullable: true },
            monthlyPayment: { type: 'number', nullable: true, example: 437.50 },
            remainingBalance: { type: 'number', nullable: true, example: 5000.00 }
          }
        },
        AirtimePurchase: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'air-001' },
            accountId: { type: 'string', example: 'acc-001' },
            phoneNumber: { type: 'string', example: '+233241234567' },
            amount: { type: 'number', example: 10.00 },
            currency: { type: 'string', example: 'GHS' },
            provider: { type: 'string', example: 'MTN' },
            status: { type: 'string', enum: ['pending', 'completed'], example: 'completed' },
            transactionReference: { type: 'string', example: 'AIR-REF-001' },
            purchasedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            deliveryStatus: { type: 'string', example: 'delivered' }
          }
        },
        KYC: {
          type: 'object',
          properties: {
            customerId: { type: 'string', example: 'cust-001' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
            level: { type: 'string', example: 'tier2' },
            documents: { type: 'array', items: { type: 'string' }, example: ['id', 'proof_of_address'] },
            riskRating: { type: 'string', enum: ['low', 'medium', 'high'], example: 'low' },
            verifiedAt: { type: 'string', format: 'date-time', nullable: true },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            pendingItems: { type: 'array', items: { type: 'string' }, example: [] }
          }
        },
        AccountLimit: {
          type: 'object',
          properties: {
            accountId: { type: 'string', example: 'acc-001' },
            dailyLimit: { type: 'number', example: 1000.00 },
            monthlyLimit: { type: 'number', example: 10000.00 },
            dailyUsed: { type: 'number', example: 250.00 },
            monthlyUsed: { type: 'number', example: 1200.00 },
            currency: { type: 'string', example: 'GHS' },
            dailyRemaining: { type: 'number', example: 750.00 },
            monthlyRemaining: { type: 'number', example: 8800.00 },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CheckerResponse: {
          type: 'object',
          properties: {
            result: { type: 'boolean', example: true },
            reason: { type: 'string', example: 'Account is active' },
            metadata: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', example: 'req-1234567890-abc123' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
            count: { type: 'integer', example: 1 },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', example: 'req-1234567890-abc123' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Account not found' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', example: 'req-1234567890-abc123' }
          }
        }
      }
    },
    tags: [
      { name: 'System', description: 'System health and status endpoints' },
      { name: 'Accounts', description: 'Account management endpoints' },
      { name: 'Transactions', description: 'Transaction and transfer endpoints' },
      { name: 'Payments', description: 'Payment and payout endpoints' },
      { name: 'Loans', description: 'Loan application workflow endpoints' },
      { name: 'Airtime', description: 'Airtime purchase endpoints' },
      { name: 'KYC', description: 'Know Your Customer (KYC) compliance endpoints' },
      { name: 'Limits', description: 'Account limits management endpoints' }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

