import express from 'express';
import {
  getAccounts,
  getAccountById,
  addAccount,
  updateAccount
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

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
 * /accounts/get:
 *   post:
 *     summary: Get account details by ID
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: acc-001
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
router.post('/get', (req, res) => {
  const { accountId } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: accountId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const account = getAccountById(accountId);
  
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
 *                 description: The unique identifier of the customer
 *                 example: cust-001
 *               type:
 *                 type: string
 *                 enum: [savings, current]
 *                 description: Type of account to create (savings or current)
 *                 example: savings
 *               currency:
 *                 type: string
 *                 description: Currency code for the account (e.g., GHS, USD, EUR, NGN)
 *                 example: GHS
 *               initialDeposit:
 *                 type: number
 *                 minimum: 0
 *                 description: Initial deposit amount (defaults to 0 if not provided)
 *                 example: 1000.00
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
  const { customerId, type, currency, initialDeposit } = req.body;

  // Validate required fields
  const requiredFields = {
    customerId,
    type,
    currency
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate type enum
  const validTypes = ['savings', 'current'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate initialDeposit if provided
  if (initialDeposit !== undefined && initialDeposit !== null) {
    if (typeof initialDeposit !== 'number' || isNaN(initialDeposit) || initialDeposit < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'initialDeposit must be a number >= 0',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  const account = addAccount({
    customerId,
    type,
    currency,
    balance: initialDeposit !== undefined && initialDeposit !== null ? initialDeposit : 0,
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
 * /accounts/update-status:
 *   post:
 *     summary: Update account status
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - status
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: acc-001
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
router.post('/update-status', (req, res) => {
  const { accountId, status } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: accountId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  const validStatuses = ['active', 'suspended', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const account = updateAccount(accountId, { status });

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
 * /accounts/check-active:
 *   get:
 *     summary: Checker endpoint - Verify if account is active
 *     description: Returns true/false indicating if the account is active. Used for workflow conditional logic.
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to false if not provided.
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/check-active', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    value: finalResult,
    message: finalResult ? 'Account is active' : 'Account is inactive',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

