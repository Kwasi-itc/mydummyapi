import express from 'express';
import {
  getAccountLimit,
  updateAccountLimit
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /limits/get:
 *   post:
 *     summary: Get account limits
 *     tags: [Limits]
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
router.post('/get', (req, res) => {
  const { accountId } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: accountId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const limit = getAccountLimit(accountId);
  
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
 * /limits/update:
 *   post:
 *     summary: Update account limits
 *     tags: [Limits]
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
router.post('/update', (req, res) => {
  const { accountId, dailyLimit, monthlyLimit } = req.body;
  
  if (!accountId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: accountId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

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

  const limit = updateAccountLimit(accountId, updates);

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
 * /limits/check-available:
 *   get:
 *     summary: Checker endpoint - Verify if limit is available for a transaction
 *     description: Returns true/false indicating if the requested amount is within the available limit. Used for workflow conditional logic.
 *     tags: [Limits]
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
router.get('/check-available', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    result: finalResult,
    reason: finalResult
      ? 'Limit is available'
      : 'Insufficient limit',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
