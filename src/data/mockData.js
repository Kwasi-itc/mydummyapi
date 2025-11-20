// In-memory data stores for all fintech entities

let accounts = [
  {
    id: 'acc-001',
    customerId: 'cust-001',
    type: 'savings',
    currency: 'GHS',
    balance: 5000.00,
    status: 'active',
    accountNumber: '1234567890',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'acc-002',
    customerId: 'cust-002',
    type: 'current',
    currency: 'GHS',
    balance: 2500.50,
    status: 'active',
    accountNumber: '1234567891',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z'
  },
  {
    id: 'acc-003',
    customerId: 'cust-001',
    type: 'savings',
    currency: 'GHS',
    balance: 10000.00,
    status: 'suspended',
    accountNumber: '1234567892',
    createdAt: '2024-01-17T12:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  }
];

let transactions = [
  {
    id: 'txn-001',
    accountId: 'acc-001',
    type: 'debit',
    amount: 100.00,
    currency: 'GHS',
    description: 'Payment to merchant',
    status: 'cleared',
    counterparty: 'merchant-123',
    initiatedAt: '2024-01-18T09:00:00Z',
    processedAt: '2024-01-18T09:05:00Z',
    reference: 'REF-001'
  },
  {
    id: 'txn-002',
    accountId: 'acc-001',
    type: 'credit',
    amount: 500.00,
    currency: 'GHS',
    description: 'Salary deposit',
    status: 'cleared',
    counterparty: 'employer-456',
    initiatedAt: '2024-01-19T10:00:00Z',
    processedAt: '2024-01-19T10:02:00Z',
    reference: 'REF-002'
  },
  {
    id: 'txn-003',
    accountId: 'acc-002',
    type: 'debit',
    amount: 50.00,
    currency: 'GHS',
    description: 'Transfer to acc-001',
    status: 'pending',
    counterparty: 'acc-001',
    initiatedAt: '2024-01-20T11:00:00Z',
    processedAt: null,
    reference: 'REF-003'
  }
];

let payments = [
  {
    id: 'pay-001',
    accountId: 'acc-001',
    beneficiary: 'John Doe',
    beneficiaryAccount: '9876543210',
    amount: 200.00,
    currency: 'GHS',
    method: 'bank_transfer',
    status: 'completed',
    reference: 'PAY-REF-001',
    initiatedAt: '2024-01-18T08:00:00Z',
    completedAt: '2024-01-18T08:15:00Z',
    kycComplete: true,
    sufficientBalance: true
  },
  {
    id: 'pay-002',
    accountId: 'acc-002',
    beneficiary: 'Jane Smith',
    beneficiaryAccount: '9876543211',
    amount: 150.00,
    currency: 'GHS',
    method: 'bank_transfer',
    status: 'pending',
    reference: 'PAY-REF-002',
    initiatedAt: '2024-01-20T10:00:00Z',
    completedAt: null,
    kycComplete: true,
    sufficientBalance: false
  }
];

let loans = [
  {
    id: 'loan-001',
    customerId: 'cust-001',
    accountId: 'acc-001',
    amount: 5000.00,
    currency: 'GHS',
    purpose: 'Business expansion',
    tenure: 12,
    interestRate: 8.5,
    status: 'approved',
    creditScore: 750,
    eligible: true,
    appliedAt: '2024-01-10T09:00:00Z',
    approvedAt: '2024-01-12T14:00:00Z',
    disbursedAt: '2024-01-13T10:00:00Z',
    monthlyPayment: 437.50,
    remainingBalance: 5000.00
  },
  {
    id: 'loan-002',
    customerId: 'cust-002',
    accountId: 'acc-002',
    amount: 3000.00,
    currency: 'GHS',
    purpose: 'Personal use',
    tenure: 6,
    interestRate: 10.0,
    status: 'pending',
    creditScore: 680,
    eligible: true,
    appliedAt: '2024-01-19T11:00:00Z',
    approvedAt: null,
    disbursedAt: null,
    monthlyPayment: 525.00,
    remainingBalance: null
  },
  {
    id: 'loan-003',
    customerId: 'cust-003',
    accountId: 'acc-003',
    amount: 10000.00,
    currency: 'GHS',
    purpose: 'Home improvement',
    tenure: 24,
    interestRate: 7.5,
    status: 'rejected',
    creditScore: 600,
    eligible: false,
    appliedAt: '2024-01-15T10:00:00Z',
    approvedAt: null,
    disbursedAt: null,
    rejectionReason: 'Insufficient credit score',
    monthlyPayment: null,
    remainingBalance: null
  }
];

let airtimePurchases = [
  {
    id: 'air-001',
    accountId: 'acc-001',
    phoneNumber: '+233241234567',
    amount: 10.00,
    currency: 'GHS',
    provider: 'MTN',
    status: 'completed',
    transactionReference: 'AIR-REF-001',
    purchasedAt: '2024-01-18T12:00:00Z',
    completedAt: '2024-01-18T12:02:00Z',
    deliveryStatus: 'delivered'
  },
  {
    id: 'air-002',
    accountId: 'acc-002',
    phoneNumber: '+233241234568',
    amount: 5.00,
    currency: 'GHS',
    provider: 'Vodafone',
    status: 'pending',
    transactionReference: 'AIR-REF-002',
    purchasedAt: '2024-01-20T13:00:00Z',
    completedAt: null,
    deliveryStatus: 'processing'
  }
];

let kycRecords = [
  {
    customerId: 'cust-001',
    status: 'approved',
    level: 'tier2',
    documents: ['id', 'proof_of_address'],
    riskRating: 'low',
    verifiedAt: '2024-01-05T10:00:00Z',
    expiresAt: '2025-01-05T10:00:00Z',
    pendingItems: []
  },
  {
    customerId: 'cust-002',
    status: 'pending',
    level: 'tier1',
    documents: ['id'],
    riskRating: 'medium',
    verifiedAt: null,
    expiresAt: null,
    pendingItems: ['proof_of_address', 'income_statement']
  },
  {
    customerId: 'cust-003',
    status: 'rejected',
    level: 'tier1',
    documents: [],
    riskRating: 'high',
    verifiedAt: null,
    expiresAt: null,
    pendingItems: ['id', 'proof_of_address'],
    rejectionReason: 'Invalid documents provided'
  }
];

let accountLimits = [
  {
    accountId: 'acc-001',
    dailyLimit: 1000.00,
    monthlyLimit: 10000.00,
    dailyUsed: 250.00,
    monthlyUsed: 1200.00,
    currency: 'GHS',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    accountId: 'acc-002',
    dailyLimit: 500.00,
    monthlyLimit: 5000.00,
    dailyUsed: 150.00,
    monthlyUsed: 800.00,
    currency: 'GHS',
    updatedAt: '2024-01-20T10:00:00Z'
  }
];

// Helper functions to manage data
export const getAccounts = () => accounts;
export const getAccountById = (id) => accounts.find(acc => acc.id === id);
export const addAccount = (account) => {
  const newAccount = {
    ...account,
    id: `acc-${String(accounts.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  accounts.push(newAccount);
  return newAccount;
};
export const updateAccount = (id, updates) => {
  const index = accounts.findIndex(acc => acc.id === id);
  if (index === -1) return null;
  accounts[index] = { ...accounts[index], ...updates, updatedAt: new Date().toISOString() };
  return accounts[index];
};

export const getTransactions = () => transactions;
export const getTransactionById = (id) => transactions.find(txn => txn.id === id);
export const addTransaction = (transaction) => {
  const newTransaction = {
    ...transaction,
    id: `txn-${String(transactions.length + 1).padStart(3, '0')}`,
    initiatedAt: new Date().toISOString(),
    processedAt: transaction.status === 'cleared' ? new Date().toISOString() : null,
    reference: transaction.reference || `REF-${String(transactions.length + 1).padStart(3, '0')}`
  };
  transactions.push(newTransaction);
  return newTransaction;
};

export const getPayments = () => payments;
export const getPaymentById = (id) => payments.find(pay => pay.id === id);
export const addPayment = (payment) => {
  const newPayment = {
    ...payment,
    id: `pay-${String(payments.length + 1).padStart(3, '0')}`,
    status: 'pending',
    initiatedAt: new Date().toISOString(),
    completedAt: null,
    reference: payment.reference || `PAY-REF-${String(payments.length + 1).padStart(3, '0')}`
  };
  payments.push(newPayment);
  return newPayment;
};
export const updatePayment = (id, updates) => {
  const index = payments.findIndex(pay => pay.id === id);
  if (index === -1) return null;
  payments[index] = { ...payments[index], ...updates };
  if (updates.status === 'completed' && !payments[index].completedAt) {
    payments[index].completedAt = new Date().toISOString();
  }
  return payments[index];
};

export const getLoans = () => loans;
export const getLoanById = (id) => loans.find(loan => loan.id === id);
export const addLoan = (loan) => {
  const newLoan = {
    ...loan,
    id: `loan-${String(loans.length + 1).padStart(3, '0')}`,
    status: 'pending',
    appliedAt: new Date().toISOString(),
    approvedAt: null,
    disbursedAt: null,
    creditScore: loan.creditScore || Math.floor(Math.random() * 200) + 500,
    eligible: (loan.creditScore || Math.floor(Math.random() * 200) + 500) >= 650
  };
  loans.push(newLoan);
  return newLoan;
};
export const updateLoan = (id, updates) => {
  const index = loans.findIndex(loan => loan.id === id);
  if (index === -1) return null;
  loans[index] = { ...loans[index], ...updates };
  if (updates.status === 'approved' && !loans[index].approvedAt) {
    loans[index].approvedAt = new Date().toISOString();
  }
  if (updates.status === 'disbursed' && !loans[index].disbursedAt) {
    loans[index].disbursedAt = new Date().toISOString();
  }
  return loans[index];
};

export const getAirtimePurchases = () => airtimePurchases;
export const getAirtimePurchaseById = (id) => airtimePurchases.find(p => p.id === id);
export const addAirtimePurchase = (purchase) => {
  const newPurchase = {
    ...purchase,
    id: `air-${String(airtimePurchases.length + 1).padStart(3, '0')}`,
    status: 'pending',
    purchasedAt: new Date().toISOString(),
    completedAt: null,
    deliveryStatus: 'processing',
    transactionReference: purchase.transactionReference || `AIR-REF-${String(airtimePurchases.length + 1).padStart(3, '0')}`
  };
  airtimePurchases.push(newPurchase);
  return newPurchase;
};
export const updateAirtimePurchase = (id, updates) => {
  const index = airtimePurchases.findIndex(p => p.id === id);
  if (index === -1) return null;
  airtimePurchases[index] = { ...airtimePurchases[index], ...updates };
  if (updates.status === 'completed' && !airtimePurchases[index].completedAt) {
    airtimePurchases[index].completedAt = new Date().toISOString();
    airtimePurchases[index].deliveryStatus = 'delivered';
  }
  return airtimePurchases[index];
};

export const getKycRecord = (customerId) => kycRecords.find(kyc => kyc.customerId === customerId);
export const updateKycRecord = (customerId, updates) => {
  const index = kycRecords.findIndex(kyc => kyc.customerId === customerId);
  if (index === -1) {
    const newRecord = {
      customerId,
      status: 'pending',
      level: 'tier1',
      documents: [],
      riskRating: 'medium',
      verifiedAt: null,
      expiresAt: null,
      pendingItems: [],
      ...updates
    };
    kycRecords.push(newRecord);
    return newRecord;
  }
  kycRecords[index] = { ...kycRecords[index], ...updates };
  if (updates.status === 'approved' && !kycRecords[index].verifiedAt) {
    kycRecords[index].verifiedAt = new Date().toISOString();
    kycRecords[index].expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return kycRecords[index];
};

export const getAccountLimit = (accountId) => accountLimits.find(limit => limit.accountId === accountId);
export const updateAccountLimit = (accountId, updates) => {
  const index = accountLimits.findIndex(limit => limit.accountId === accountId);
  if (index === -1) {
    const newLimit = {
      accountId,
      dailyLimit: 1000.00,
      monthlyLimit: 10000.00,
      dailyUsed: 0,
      monthlyUsed: 0,
      currency: 'GHS',
      updatedAt: new Date().toISOString(),
      ...updates
    };
    accountLimits.push(newLimit);
    return newLimit;
  }
  accountLimits[index] = { ...accountLimits[index], ...updates, updatedAt: new Date().toISOString() };
  return accountLimits[index];
};

