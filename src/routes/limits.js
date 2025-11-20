import express from 'express';
import {
  getAccountLimit,
  updateAccountLimit
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /limits/{accountId}:
 *   get:
 *     summary: Get account limits
 *     tags: [Limits]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account limits
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AccountLimit'
 *       404:
 *         description: Account limits not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:accountId', (req, res) => {
  const limit = getAccountLimit(req.params.accountId);
  
  if (!limit) {
    return res.status(404).json({
      status: 'error',
      message: 'Account limits not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const dailyRemaining = limit.dailyLimit - limit.dailyUsed;
  const monthlyRemaining = limit.monthlyLimit - limit.monthlyUsed;

  res.json({
    status: 'success',
    data: {
      ...limit,
      dailyRemaining,
      monthlyRemaining,
      dailyAvailable: dailyRemaining > 0,
      monthlyAvailable: monthlyRemaining > 0
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /limits/{accountId}/update:
 *   post:
 *     summary: Update account limits
 *     tags: [Limits]
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
 *             properties:
 *               dailyLimit:
 *                 type: number
 *                 example: 2000.00
 *               monthlyLimit:
 *                 type: number
 *                 example: 20000.00
 *     responses:
 *       200:
 *         description: Account limits updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AccountLimit'
 *       400:
 *         description: Invalid limit values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:accountId/update', (req, res) => {
  const { dailyLimit, monthlyLimit } = req.body;

  if (!dailyLimit && !monthlyLimit) {
    return res.status(400).json({
      status: 'error',
      message: 'At least one limit must be provided: dailyLimit or monthlyLimit',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const updates = {};
  if (dailyLimit !== undefined) {
    if (dailyLimit < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'dailyLimit must be >= 0',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    updates.dailyLimit = dailyLimit;
  }
  if (monthlyLimit !== undefined) {
    if (monthlyLimit < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'monthlyLimit must be >= 0',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    updates.monthlyLimit = monthlyLimit;
  }

  const limit = updateAccountLimit(req.params.accountId, updates);

  res.json({
    status: 'success',
    data: limit,
    message: 'Account limits updated',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /limits/{accountId}/check-available:
 *   get:
 *     summary: Checker endpoint - Verify if limit is available for a transaction
 *     description: Returns true/false indicating if the requested amount is within the available limit. Used for workflow conditional logic.
 *     tags: [Limits]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to check
 *         example: 500.00
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly]
 *           default: daily
 *         description: Period to check (daily or monthly)
 *         example: daily
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/:accountId/check-available', (req, res) => {
  const { amount, period = 'daily' } = req.query;
  const limit = getAccountLimit(req.params.accountId);

  if (!limit) {
    return res.json({
      result: false,
      reason: 'Account limits not found',
      metadata: { accountId: req.params.accountId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const amountNum = parseFloat(amount);
  if (!amount || isNaN(amountNum) || amountNum <= 0) {
    return res.json({
      result: false,
      reason: 'Amount must be provided and greater than 0',
      metadata: { accountId: req.params.accountId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  let isAvailable = false;
  let remaining = 0;
  let reason = '';

  if (period === 'daily') {
    remaining = limit.dailyLimit - limit.dailyUsed;
    isAvailable = remaining >= amountNum;
    reason = isAvailable 
      ? `Daily limit available: ${remaining} ${limit.currency}` 
      : `Insufficient daily limit. Available: ${remaining} ${limit.currency}, Required: ${amountNum} ${limit.currency}`;
  } else if (period === 'monthly') {
    remaining = limit.monthlyLimit - limit.monthlyUsed;
    isAvailable = remaining >= amountNum;
    reason = isAvailable 
      ? `Monthly limit available: ${remaining} ${limit.currency}` 
      : `Insufficient monthly limit. Available: ${remaining} ${limit.currency}, Required: ${amountNum} ${limit.currency}`;
  } else {
    return res.json({
      result: false,
      reason: 'Period must be "daily" or "monthly"',
      metadata: { accountId: req.params.accountId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    result: isAvailable,
    reason,
    metadata: {
      accountId: limit.accountId,
      period,
      requestedAmount: amountNum,
      remaining,
      limit: period === 'daily' ? limit.dailyLimit : limit.monthlyLimit,
      used: period === 'daily' ? limit.dailyUsed : limit.monthlyUsed,
      currency: limit.currency
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
