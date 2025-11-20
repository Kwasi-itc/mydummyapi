import express from 'express';
import {
  getTransactions,
  getTransactionById,
  addTransaction
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List transactions with optional filters
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, cleared]
 *         description: Filter by transaction status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [debit, credit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO format)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date (ISO format)
 *     responses:
 *       200:
 *         description: List of transactions
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
 *                         $ref: '#/components/schemas/Transaction'
 */
router.get('/', (req, res) => {
  const { accountId, status, type, dateFrom, dateTo } = req.query;
  let transactions = getTransactions();

  if (accountId) {
    transactions = transactions.filter(txn => txn.accountId === accountId);
  }
  if (status) {
    transactions = transactions.filter(txn => txn.status === status);
  }
  if (type) {
    transactions = transactions.filter(txn => txn.type === type);
  }
  if (dateFrom) {
    transactions = transactions.filter(txn => txn.initiatedAt >= dateFrom);
  }
  if (dateTo) {
    transactions = transactions.filter(txn => txn.initiatedAt <= dateTo);
  }

  res.json({
    status: 'success',
    data: transactions,
    count: transactions.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /transactions/{txnId}:
 *   get:
 *     summary: Get transaction details by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: txnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:txnId', (req, res) => {
  const transaction = getTransactionById(req.params.txnId);
  
  if (!transaction) {
    return res.status(404).json({
      status: 'error',
      message: 'Transaction not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: transaction,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction/transfer
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccount
 *               - toAccount
 *               - amount
 *               - currency
 *             properties:
 *               fromAccount:
 *                 type: string
 *                 example: acc-001
 *               toAccount:
 *                 type: string
 *                 example: acc-002
 *               amount:
 *                 type: number
 *                 example: 100.00
 *               currency:
 *                 type: string
 *                 example: GHS
 *               purpose:
 *                 type: string
 *                 example: Payment for services
 *     responses:
 *       201:
 *         description: Transaction initiated (returns both debit and credit transactions)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         debitTransaction:
 *                           $ref: '#/components/schemas/Transaction'
 *                         creditTransaction:
 *                           $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Missing required fields or invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res) => {
  const { fromAccount, toAccount, amount, currency, purpose } = req.body;

  if (!fromAccount || !toAccount || !amount || !currency) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: fromAccount, toAccount, amount, currency',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Amount must be greater than 0',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Create debit transaction
  const debitTransaction = addTransaction({
    accountId: fromAccount,
    type: 'debit',
    amount,
    currency,
    description: purpose || `Transfer to ${toAccount}`,
    status: 'pending',
    counterparty: toAccount
  });

  // Create credit transaction
  const creditTransaction = addTransaction({
    accountId: toAccount,
    type: 'credit',
    amount,
    currency,
    description: purpose || `Transfer from ${fromAccount}`,
    status: 'pending',
    counterparty: fromAccount
  });

  res.status(201).json({
    status: 'success',
    data: {
      debitTransaction,
      creditTransaction
    },
    message: 'Transaction initiated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /transactions/{txnId}/check-cleared:
 *   get:
 *     summary: Checker endpoint - Verify if transaction has been cleared
 *     description: Returns true/false indicating if the transaction has been cleared. Used for workflow conditional logic.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: txnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/:txnId/check-cleared', (req, res) => {
  const transaction = getTransactionById(req.params.txnId);

  if (!transaction) {
    return res.json({
      result: false,
      reason: 'Transaction not found',
      metadata: { transactionId: req.params.txnId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isCleared = transaction.status === 'cleared';
  
  res.json({
    result: isCleared,
    reason: isCleared 
      ? 'Transaction has been cleared' 
      : `Transaction status is: ${transaction.status}`,
    metadata: {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      processedAt: transaction.processedAt
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
