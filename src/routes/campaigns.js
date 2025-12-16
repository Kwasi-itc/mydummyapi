import express from 'express';
import { addCampaign, getGroupById, getCampaigns } from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /chango/campaigns/group/create:
 *   post:
 *     summary: Create a campaign for a private group
 *     description: Create a campaign for a private group. Campaigns allow group members to contribute towards specific fundraising goals within their private group.
 *     tags: [Chango]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *               - campaignName
 *               - campaignDetails
 *               - campaignType
 *             properties:
 *               groupName:
 *                 type: string
 *                 description: Name of the group that the campaign is being created for
 *                 example: "Savings Circle 2024"
 *               campaignName:
 *                 type: string
 *                 description: Name of the campaign
 *                 example: "Emergency Fund Drive"
 *               campaignDetails:
 *                 type: string
 *                 description: Details about the campaign
 *                 example: "Raising funds for emergency situations within our group"
 *               campaignType:
 *                 type: string
 *                 enum: [Perpetual Campaign, Temporary Campaign]
 *                 description: Type of campaign - Perpetual Campaign runs indefinitely, Temporary Campaign has an end date and target amount
 *                 example: Temporary Campaign
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the campaign (YYYY-MM-DD format, required only if campaignType is 'Temporary Campaign')
 *                 example: "2024-12-31"
 *               targetAmount:
 *                 type: number
 *                 minimum: 1
 *                 description: Target fundraising amount (required only if campaignType is 'Temporary Campaign')
 *                 example: 5000.00
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/group/create', (req, res) => {
  const {
    groupName,
    campaignName,
    campaignDetails,
    campaignType,
    endDate,
    targetAmount
  } = req.body;

  // Validate required fields
  const requiredFields = {
    groupName,
    campaignName,
    campaignDetails,
    campaignType
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

  // Validate campaignType enum
  const validCampaignTypes = ['Perpetual Campaign', 'Temporary Campaign'];
  if (!validCampaignTypes.includes(campaignType)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid campaignType. Must be one of: ${validCampaignTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate conditional fields for Temporary Campaign
  if (campaignType === 'Temporary Campaign') {
    if (!endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'endDate is required when campaignType is "Temporary Campaign"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (!targetAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'targetAmount is required when campaignType is "Temporary Campaign"',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    // Validate endDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'endDate must be in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    // Validate endDate is in the future
    const endDateObj = new Date(endDate);
    if (isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'endDate must be a valid date',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    if (endDateObj <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'endDate must be in the future',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }

    // Validate targetAmount
    if (typeof targetAmount !== 'number' || targetAmount < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'targetAmount must be a number greater than or equal to 1',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  // Verify group exists (simplified check - in real app, would query by groupName)
  // For now, we'll just create the campaign
  // In a real implementation, you'd check: const group = getGroupByName(groupName);

  // Create the campaign
  const campaign = addCampaign({
    groupName,
    campaignName,
    campaignDetails,
    campaignType,
    endDate: campaignType === 'Temporary Campaign' ? endDate : null,
    targetAmount: campaignType === 'Temporary Campaign' ? targetAmount : null
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: campaign.id,
      groupName: campaign.groupName,
      campaignName: campaign.campaignName,
      campaignDetails: campaign.campaignDetails,
      campaignType: campaign.campaignType,
      endDate: campaign.endDate,
      targetAmount: campaign.targetAmount,
      currentAmount: campaign.currentAmount,
      contributorCount: campaign.contributorCount,
      status: campaign.status,
      createdAt: campaign.createdAt
    },
    message: 'Campaign created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/campaigns/group:
 *   get:
 *     summary: Get all campaigns for a group
 *     description: Retrieve all campaigns associated with a specific group. Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: query
 *         name: groupName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the group to get campaigns for
 *         example: "Savings Circle 2024"
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: List of campaigns retrieved successfully
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
 *                         $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Missing required parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/group', (req, res) => {
  const { groupName } = req.query;

  // Validate required parameter
  if (!groupName) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: groupName',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Get all campaigns and filter by groupName
  const allCampaigns = getCampaigns();
  const groupCampaigns = allCampaigns.filter(campaign => campaign.groupName === groupName);

  res.json({
    status: 'success',
    data: groupCampaigns,
    count: groupCampaigns.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

