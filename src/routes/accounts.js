import express from 'express';
import {
  getAccounts,
  getAccountById,
  addAccount,
  updateAccount
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: List all accounts with optional filters
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, closed]
 *         description: Filter by account status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [savings, current]
 *         description: Filter by account type
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Account'
 */
router.get('/', (req, res) => {
  const { customerId, status, type, currency } = req.query;
  let accounts = getAccounts();

  if (customerId) {
    accounts = accounts.filter(acc => acc.customerId === customerId);
  }
  if (status) {
    accounts = accounts.filter(acc => acc.status === status);
  }
  if (type) {
    accounts = accounts.filter(acc => acc.type === type);
  }
  if (currency) {
    accounts = accounts.filter(acc => acc.currency === currency);
  }

  res.json({
    status: 'success',
    data: accounts,
    count: accounts.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: Get account details by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:accountId', (req, res) => {
  const account = getAccountById(req.params.accountId);
  
  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: account,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - type
 *               - currency
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cust-001
 *               type:
 *                 type: string
 *                 enum: [savings, current]
 *                 example: savings
 *               currency:
 *                 type: string
 *                 example: GHS
 *               initialDeposit:
 *                 type: number
 *                 example: 1000.00
 *               kycLevel:
 *                 type: string
 *                 example: tier2
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res) => {
  const { customerId, type, currency, initialDeposit, kycLevel } = req.body;

  if (!customerId || !type || !currency) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: customerId, type, currency',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const account = addAccount({
    customerId,
    type,
    currency,
    balance: initialDeposit || 0,
    status: 'active',
    accountNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000)
  });

  res.status(201).json({
    status: 'success',
    data: account,
    message: 'Account created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/{accountId}/status:
 *   patch:
 *     summary: Update account status
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, closed]
 *                 example: suspended
 *     responses:
 *       200:
 *         description: Account status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:accountId/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'suspended', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const account = updateAccount(req.params.accountId, { status });

  if (!account) {
    return res.status(404).json({
      status: 'error',
      message: 'Account not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: account,
    message: 'Account status updated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /accounts/{accountId}/check-active:
 *   post:
 *     summary: Checker endpoint - Verify if account is active
 *     description: Returns true/false indicating if the account is active. Used for workflow conditional logic.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.post('/:accountId/check-active', (req, res) => {
  const account = getAccountById(req.params.accountId);

  if (!account) {
    return res.json({
      result: false,
      reason: 'Account not found',
      metadata: { accountId: req.params.accountId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isActive = account.status === 'active';
  
  res.json({
    result: isActive,
    reason: isActive ? 'Account is active' : `Account status is: ${account.status}`,
    metadata: {
      accountId: account.id,
      status: account.status,
      accountNumber: account.accountNumber
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

