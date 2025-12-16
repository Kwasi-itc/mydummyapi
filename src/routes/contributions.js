import express from 'express';
import { addContribution } from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /chango/contributions/create:
 *   post:
 *     summary: Make a contribution to a private group or campaign
 *     description: Make a contribution to a private group or a campaign under the group. Contributions can be made anonymously, set as recurring, or made on behalf of someone else. Bearer token may be provided but is not required (dummy implementation).
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
 *               - groupName
 *               - contributionType
 *               - walletId
 *               - amount
 *             properties:
 *               groupName:
 *                 type: string
 *                 description: Name of the group to contribute to
 *                 example: "Savings Circle 2024"
 *               contributionType:
 *                 type: string
 *                 enum: [group, campaign]
 *                 description: Whether contributing to the group itself or a campaign under the group
 *                 example: campaign
 *               campaignName:
 *                 type: string
 *                 description: Name of the campaign (required only if contributionType is 'campaign')
 *                 example: "Emergency Fund Drive"
 *               walletId:
 *                 type: string
 *                 description: ID of the wallet to use for the contribution
 *                 example: "wal-001"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Contribution amount
 *                 example: 100.00
 *               reference:
 *                 type: string
 *                 description: Optional reference or note for the contribution
 *                 example: "Monthly contribution"
 *               anonymous:
 *                 type: boolean
 *                 description: Whether to make this contribution anonymous - your name will be hidden from members but not the admin
 *                 example: false
 *               recurring:
 *                 type: boolean
 *                 description: Whether to make this a recurring payment
 *                 example: false
 *               contributeOnBehalf:
 *                 type: boolean
 *                 description: Whether to contribute on behalf of someone else (charges 1 cedi, requires approval from the other person)
 *                 example: false
 *               onBehalfPhoneNumber:
 *                 type: string
 *                 description: Phone number of the person you're contributing on behalf of (required only if contributeOnBehalf is true)
 *                 example: "+233241234568"
 *     responses:
 *       201:
 *         description: Contribution created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Contribution'
 * */
router.post('/create', (req, res) => {
  const {
    groupName,
    contributionType,
    campaignName,
    walletId,
    amount,
    reference,
    anonymous = false,
    recurring = false,
    contributeOnBehalf = false,
    onBehalfPhoneNumber
  } = req.body;

  // Calculate total amount (add 1 cedi fee if contributing on behalf)
  const totalAmount = contributeOnBehalf ? (amount || 0) + 1 : (amount || 0);

  // Create the contribution - no validations, just create it
  const contribution = addContribution({
    groupName: groupName || null,
    contributionType: contributionType || null,
    campaignName: campaignName || null,
    walletId: walletId || null,
    amount: amount || 0,
    totalAmount,
    reference: reference || null,
    anonymous: anonymous || false,
    recurring: recurring || false,
    contributeOnBehalf: contributeOnBehalf || false,
    onBehalfPhoneNumber: onBehalfPhoneNumber || null,
    onBehalfFee: contributeOnBehalf ? 1 : 0
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: contribution.id,
      groupName: contribution.groupName,
      contributionType: contribution.contributionType,
      campaignName: contribution.campaignName,
      walletId: contribution.walletId,
      amount: contribution.amount,
      totalAmount: contribution.totalAmount,
      onBehalfFee: contribution.onBehalfFee,
      reference: contribution.reference,
      anonymous: contribution.anonymous,
      recurring: contribution.recurring,
      contributeOnBehalf: contribution.contributeOnBehalf,
      onBehalfPhoneNumber: contribution.onBehalfPhoneNumber,
      status: contribution.status,
      createdAt: contribution.createdAt,
      processedAt: contribution.processedAt
    },
    message: contributeOnBehalf 
      ? 'Contribution created successfully. Pending approval from the person you\'re contributing on behalf of.'
      : 'Contribution created successfully. Thank you for your contribution!',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

