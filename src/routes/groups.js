import express from 'express';
import { addGroup, getGroups, getGroupById, updateGroup } from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /chango/groups/private/create:
 *   post:
 *     summary: Create a private group
 *     tags: [Chango]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *               - groupName
 *               - description
 *               - cashoutPolicy
 *               - termsAndConditions
 *               - agreedToTerms
 *             properties:
 *               country:
 *                 type: string
 *                 enum: [Ghana, Kenya, Liberia, Rwanda]
 *                 description: Country where the group will operate
 *                 example: Ghana
 *               groupName:
 *                 type: string
 *                 description: Name of the private group
 *                 example: "Savings Circle 2024"
 *               description:
 *                 type: string
 *                 description: Description or purpose of the group
 *                 example: "A savings group for monthly contributions"
 *               cashoutPolicy:
 *                 type: string
 *                 enum: ["admin-only", "25%", "50%", "75%", "100%"]
 *                 description: Cashout policy - percentage of members who must vote to approve a cashout, or 'admin-only' for admin-only withdrawals
 *                 example: "50%"
 *               termsAndConditions:
 *                 type: string
 *                 description: Group specific terms and conditions
 *                 example: "Members must contribute monthly. No withdrawals without group approval."
 *               agreedToTerms:
 *                 type: boolean
 *                 description: I have agreed to the terms and conditions provided
 *                 example: true
 *               invitePhoneNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional - Phone numbers of people you want to invite to the group
 *                 example: ["+233241234567", "+233241234568"]
 *     responses:
 *       201:
 *         description: Private group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Group'
 *       400:
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/private/create', (req, res) => {
  const {
    country,
    groupName,
    description,
    cashoutPolicy,
    termsAndConditions,
    agreedToTerms,
    invitePhoneNumbers
  } = req.body;

  // Validate required fields
  const requiredFields = {
    country,
    groupName,
    description,
    cashoutPolicy,
    termsAndConditions,
    agreedToTerms
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

  // Validate country enum
  const validCountries = ['Ghana', 'Kenya', 'Liberia', 'Rwanda'];
  if (!validCountries.includes(country)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid country. Must be one of: ${validCountries.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate cashoutPolicy enum
  const validCashoutPolicies = ['admin-only', '25%', '50%', '75%', '100%'];
  if (!validCashoutPolicies.includes(cashoutPolicy)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid cashoutPolicy. Must be one of: ${validCashoutPolicies.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate agreedToTerms is boolean and true
  if (typeof agreedToTerms !== 'boolean' || !agreedToTerms) {
    return res.status(400).json({
      status: 'error',
      message: 'You must agree to the terms and conditions to create a group',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate invitePhoneNumbers if provided
  if (invitePhoneNumbers !== undefined) {
    if (!Array.isArray(invitePhoneNumbers)) {
      return res.status(400).json({
        status: 'error',
        message: 'invitePhoneNumbers must be an array',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
    
    // Validate all items in array are strings
    if (!invitePhoneNumbers.every(phone => typeof phone === 'string')) {
      return res.status(400).json({
        status: 'error',
        message: 'All items in invitePhoneNumbers must be strings',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      });
    }
  }

  // Create the group
  const group = addGroup({
    country,
    groupName,
    description,
    cashoutPolicy,
    termsAndConditions,
    agreedToTerms,
    invitePhoneNumbers: invitePhoneNumbers || []
  });

  res.status(201).json({
    status: 'success',
    data: {
      id: group.id,
      groupName: group.groupName,
      country: group.country,
      description: group.description,
      cashoutPolicy: group.cashoutPolicy,
      termsAndConditions: group.termsAndConditions,
      status: group.status,
      memberCount: group.memberCount,
      members: group.members,
      createdAt: group.createdAt
    },
    message: 'Private group created successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/groups:
 *   get:
 *     summary: Get all groups for the authenticated user
 *     description: Retrieve all groups associated with the authenticated user. Bearer token may be provided but is not required (dummy implementation - returns all groups).
 *     tags: [Chango]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: List of groups retrieved successfully
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
 *                         $ref: '#/components/schemas/Group'
 */
router.get('/', (req, res) => {
  // Bearer token may be provided but is not required or validated (dummy implementation)
  // In a real implementation, we would validate the token and get the user ID
  // For this dummy implementation, we just return all groups
  const groups = getGroups();

  res.json({
    status: 'success',
    data: groups,
    count: groups.length,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/groups/check-exists:
 *   get:
 *     summary: Checker endpoint - Verify if group exists
 *     description: Returns true/false indicating if a group with the specified name exists. Used for workflow conditional logic. Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: query
 *         name: groupName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the group to check
 *         example: "Savings Circle 2024"
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to checking if group exists if not provided.
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/check-exists', (req, res) => {
  const { groupName, result } = req.query;

  // Check if result is forced
  const forced = getForcedBoolean(result);
  
  let finalResult;
  if (forced !== null) {
    // Use forced value
    finalResult = forced;
  } else {
    // Check if group exists by name
    const groups = getGroups();
    finalResult = groups.some(group => group.groupName === groupName);
  }

  res.json({
    value: finalResult,
    message: finalResult
      ? `Group "${groupName}" exists`
      : `Group "${groupName}" does not exist`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/groups/check-member:
 *   get:
 *     summary: Checker endpoint - Verify if user is a member of a group
 *     description: Returns true/false indicating if the authenticated user is a member of the specified group. Used for workflow conditional logic. Bearer token may be provided but is not required (dummy implementation - checks if group has members).
 *     tags: [Chango]
 *     parameters:
 *       - in: query
 *         name: groupName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the group to check membership
 *         example: "Savings Circle 2024"
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to checking if user is a member if not provided.
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Optional bearer token (not validated in dummy implementation)
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.get('/check-member', (req, res) => {
  const { groupName, result } = req.query;

  // Check if result is forced
  const forced = getForcedBoolean(result);
  
  let finalResult;
  if (forced !== null) {
    // Use forced value
    finalResult = forced;
  } else {
    // Check if user is a member of the group (dummy implementation)
    // In real implementation, would check authenticated user's membership
    const groups = getGroups();
    const group = groups.find(g => g.groupName === groupName);
    
    if (!group) {
      finalResult = false;
    } else {
      // In dummy implementation, check if group has members
      // In real implementation, would check if authenticated user is in group.members
      finalResult = group.memberCount > 0;
    }
  }

  res.json({
    value: finalResult,
    message: finalResult
      ? `User is a member of group "${groupName}"`
      : `User is not a member of group "${groupName}"`,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/groups/invite:
 *   post:
 *     summary: Invite people to join a private group
 *     description: Invite people to join a private group by sending invitations to their phone numbers. The user must be a member of the group to invite others. Bearer token may be provided but is not required (dummy implementation).
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
 *               - phoneNumbers
 *             properties:
 *               groupName:
 *                 type: string
 *                 description: Name of the group to invite people to
 *                 example: "Savings Circle 2024"
 *               phoneNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of phone numbers to invite to the group
 *                 example: ["+233241234567", "+233241234568"]
 *     responses:
 *       201:
 *         description: Invitations sent successfully
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
 *                         groupName:
 *                           type: string
 *                         phoneNumbers:
 *                           type: array
 *                           items:
 *                             type: string
 *                         invitationsSent:
 *                           type: number
 *                         message:
 *                           type: string
 */
router.post('/invite', (req, res) => {
  const { groupName, phoneNumbers } = req.body;

  // No validations - just create the invitation
  // In dummy implementation, we'll update the group's members list
  const groups = getGroups();
  const group = groups.find(g => g.groupName === groupName);

  let updatedGroup = null;
  if (group) {
    // Add new phone numbers to members list (avoid duplicates)
    const existingMembers = group.members || [];
    const newMembers = Array.isArray(phoneNumbers) ? phoneNumbers : [];
    const uniqueMembers = [...new Set([...existingMembers, ...newMembers])];
    
    updatedGroup = updateGroup(group.id, {
      members: uniqueMembers,
      memberCount: uniqueMembers.length + 1 // +1 for creator
    });
  }

  const invitationsSent = Array.isArray(phoneNumbers) ? phoneNumbers.length : 0;

  res.status(201).json({
    status: 'success',
    data: {
      groupName: groupName || null,
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers : [],
      invitationsSent,
      message: `Invitations sent to ${invitationsSent} phone number(s)`
    },
    message: 'Invitations sent successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

