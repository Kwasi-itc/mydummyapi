import express from 'express';
import {
  getKycRecord,
  updateKycRecord
} from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /kyc/customers/get:
 *   post:
 *     summary: Get KYC status for a customer
 *     tags: [KYC]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Simulation value to return (true/false as string).
 *       - in: query
 *         name: forceResult
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Testing helper. Set to true/false (as string) to force the checker response.
 *     responses:
 *       200:
 *         description: KYC record
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KYC'
 *       404:
 *         description: KYC record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customers/get', (req, res) => {
  const { customerId } = req.body;
  
  if (!customerId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: customerId',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  const kyc = getKycRecord(customerId);
  
  if (!kyc) {
    return res.status(404).json({
      status: 'error',
      message: 'KYC record not found',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  res.json({
    status: 'success',
    data: kyc,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /kyc/customers/refresh:
 *   post:
 *     summary: Refresh KYC check
 *     tags: [KYC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - address
 *               - id_type
 *               - full_name
 *               - id_number
 *               - phone_number
 *               - date_of_birth
 *             properties:
 *               customerId:
 *                 type: string
 *                 example: cust-001
 *               address:
 *                 type: string
 *                 description: Your current residential address
 *                 example: "123 Main Street, Accra, Ghana"
 *               id_type:
 *                 type: string
 *                 enum: [passport, national_id, drivers_license]
 *                 description: What type of identification document will you be using
 *                 example: national_id
 *               full_name:
 *                 type: string
 *                 description: Your full legal name as it appears on your ID
 *                 example: "John Doe"
 *               id_number:
 *                 type: string
 *                 description: Your identification document number
 *                 example: "GHA-123456789"
 *               phone_number:
 *                 type: string
 *                 description: Your contact phone number
 *                 example: "+233241234567"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: Your date of birth (YYYY-MM-DD format)
 *                 example: "1990-01-15"
 *     responses:
 *       200:
 *         description: KYC check refreshed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KYC'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/customers/refresh', (req, res) => {
  const { 
    customerId, 
    address, 
    id_type, 
    full_name, 
    id_number, 
    phone_number, 
    date_of_birth 
  } = req.body;
  
  // Validate required fields
  const requiredFields = {
    customerId,
    address,
    id_type,
    full_name,
    id_number,
    phone_number,
    date_of_birth
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate id_type enum
  const validIdTypes = ['passport', 'national_id', 'drivers_license'];
  if (!validIdTypes.includes(id_type)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid id_type. Must be one of: ${validIdTypes.join(', ')}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  // Validate date_of_birth format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date_of_birth)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid date_of_birth format. Must be YYYY-MM-DD',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const existingKyc = getKycRecord(customerId);

  // Simulate KYC validation logic - approve if all required fields are provided
  const hasAllRequiredFields = address && id_type && full_name && id_number && phone_number && date_of_birth;
  const riskRating = hasAllRequiredFields ? 'low' : 'medium';
  const newStatus = hasAllRequiredFields ? 'approved' : 'pending';

  const kyc = updateKycRecord(customerId, {
    status: newStatus,
    level: existingKyc?.level || 'tier1',
    documents: existingKyc?.documents || [id_type],
    riskRating,
    pendingItems: hasAllRequiredFields ? [] : ['proof_of_address', 'income_statement'],
    // Store the new KYC information
    address,
    idType: id_type,
    fullName: full_name,
    idNumber: id_number,
    phoneNumber: phone_number,
    dateOfBirth: date_of_birth
  });

  res.json({
    status: 'success',
    data: kyc,
    message: 'KYC check refreshed',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /kyc/customers/check-approved:
 *   get:
 *     summary: Checker endpoint - Verify if KYC is approved
 *     description: Returns true/false indicating if the KYC is approved. Used for workflow conditional logic.
 *     tags: [KYC]
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
router.get('/customers/check-approved', (req, res) => {
  const { result } = req.query;

  const forced = getForcedBoolean(result);
  const finalResult = forced !== null ? forced : false;

  res.json({
    value: finalResult,
    message: finalResult
      ? 'KYC is approved'
      : 'KYC is pending approval, please check again after 24 to 48 hours',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
