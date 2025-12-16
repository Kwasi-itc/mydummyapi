import express from 'express';
import { addCashout } from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /chango/cashout:
 *   post:
 *     summary: Withdraw funds from a campaign
 *     description: Cashout workflow to withdraw funds from a campaign. KYC verification must be completed before cashout. Can cashout for yourself, a group member, or others. Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaignName
 *               - amount
 *               - reason
 *               - cashoutType
 *               - cashoutWalletId
 *             properties:
 *               campaignName:
 *                 type: string
 *                 description: Name of the campaign to cashout from
 *                 example: "Emergency Fund Drive"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Amount to cashout
 *                 example: 500.00
 *               reason:
 *                 type: string
 *                 description: Reason for the cashout
 *                 example: "Emergency medical expenses"
 *               cashoutType:
 *                 type: string
 *                 enum: [yourself, member, other]
 *                 description: Who the cashout is for - yourself, a member, or other
 *                 example: yourself
 *               memberPhoneNumber:
 *                 type: string
 *                 description: Member's phone number (required only if cashoutType is 'member')
 *                 example: "+233241234567"
 *               otherPhoneNumber:
 *                 type: string
 *                 description: Phone number (required only if cashoutType is 'other')
 *                 example: "+233241234568"
 *               cashoutWalletId:
 *                 type: string
 *                 description: ID of the wallet to receive the cashout
 *                 example: "wal-001"
 *     responses:
 *       201:
 *         description: Cashout request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Cashout'
 */
router.post('/', (req, res) => {
  const {
    campaignName,
    amount,
    reason,
    cashoutType,
    memberPhoneNumber,
    otherPhoneNumber,
    cashoutWalletId
  } = req.body;

  // No validations - just create the cashout
  const cashout = addCashout({
    campaignName: campaignName || null,
    amount: amount || 0,
    reason: reason || null,
    cashoutType: cashoutType || null,
    memberPhoneNumber: cashoutType === 'member' ? (memberPhoneNumber || null) : null,
    otherPhoneNumber: cashoutType === 'other' ? (otherPhoneNumber || null) : null,
    cashoutWalletId: cashoutWalletId || null
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: cashout.id,
      campaignName: cashout.campaignName,
      amount: cashout.amount,
      reason: cashout.reason,
      cashoutType: cashout.cashoutType,
      memberPhoneNumber: cashout.memberPhoneNumber,
      otherPhoneNumber: cashout.otherPhoneNumber,
      cashoutWalletId: cashout.cashoutWalletId,
      status: cashout.status,
      createdAt: cashout.createdAt,
      processedAt: cashout.processedAt
    },
    message: 'Cashout request created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

