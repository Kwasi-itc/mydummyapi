import express from 'express';
import { getKycRecord, updateKycRecord } from '../data/mockData.js';
import { getForcedBoolean } from '../utils/forceResult.js';

const router = express.Router();

/**
 * @swagger
 * /chango/kyc/verify:
 *   post:
 *     summary: KYC verification - Submit gender and national ID for identity verification
 *     description: Know Your Customer (KYC) verification workflow that collects gender and national ID number for identity verification. Bearer token may be provided but is not required (dummy implementation).
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
 *               - gender
 *               - idNumber
 *             properties:
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Gender
 *                 example: male
 *               idNumber:
 *                 type: string
 *                 description: National ID number
 *                 example: "GHA-123456789"
 *     responses:
 *       201:
 *         description: KYC verification submitted successfully
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
 *                         gender:
 *                           type: string
 *                         idNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                         verifiedAt:
 *                           type: string
 */
router.post('/verify', (req, res) => {
  const { gender, idNumber } = req.body;

  // No validations - just create/update the KYC record
  // In dummy implementation, we'll use a dummy customerId
  // In real implementation, would extract customerId from bearer token
  const customerId = 'cust-chango-001'; // Dummy customer ID

  // Get or create KYC record
  let kyc = getKycRecord(customerId);
  
  if (!kyc) {
    // Create new KYC record
    kyc = updateKycRecord(customerId, {
      status: 'pending',
      level: 'tier1',
      documents: ['national_id'],
      riskRating: 'medium',
      gender,
      idNumber
    });
  } else {
    // Update existing KYC record
    kyc = updateKycRecord(customerId, {
      gender,
      idNumber,
      documents: [...(kyc.documents || []), 'national_id'].filter((v, i, a) => a.indexOf(v) === i) // Add national_id if not already present
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      gender: kyc.gender || gender,
      idNumber: kyc.idNumber || idNumber,
      status: kyc.status,
      verifiedAt: kyc.verifiedAt,
      level: kyc.level
    },
    message: 'KYC verification submitted successfully',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

/**
 * @swagger
 * /chango/kyc/check-verified:
 *   get:
 *     summary: Checker endpoint - Verify if KYC is verified
 *     description: Returns true/false indicating if the user's KYC is verified. Used for workflow conditional logic. Bearer token may be provided but is not required (dummy implementation).
 *     tags: [Chango]
 *     parameters:
 *       - in: query
 *         name: result
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Optional. Set to true/false (as string) to force the checker response. Defaults to checking KYC status if not provided.
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
router.get('/check-verified', (req, res) => {
  const { result } = req.query;

  // Check if result is forced
  const forced = getForcedBoolean(result);
  
  let finalResult;
  if (forced !== null) {
    // Use forced value
    finalResult = forced;
  } else {
    // Check if KYC is verified (dummy implementation)
    // In real implementation, would extract customerId from bearer token
    const customerId = 'cust-chango-001'; // Dummy customer ID
    const kyc = getKycRecord(customerId);
    
    // KYC is verified if status is 'approved' and has verifiedAt timestamp
    finalResult = kyc && kyc.status === 'approved' && kyc.verifiedAt !== null;
  }

  res.json({
    value: finalResult,
    message: finalResult
      ? 'KYC is verified'
      : 'KYC is not verified',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;

