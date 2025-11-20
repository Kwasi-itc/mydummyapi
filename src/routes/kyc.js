import express from 'express';
import {
  getKycRecord,
  updateKycRecord
} from '../data/mockData.js';

const router = express.Router();

/**
 * @swagger
 * /kyc/customers/{customerId}:
 *   get:
 *     summary: Get KYC status for a customer
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
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
router.get('/customers/:customerId', (req, res) => {
  const kyc = getKycRecord(req.params.customerId);
  
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
 * /kyc/customers/{customerId}/refresh:
 *   post:
 *     summary: Refresh KYC check
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [id, proof_of_address, income_statement]
 *               level:
 *                 type: string
 *                 example: tier2
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
 */
router.post('/customers/:customerId/refresh', (req, res) => {
  const { documents, level } = req.body;
  const existingKyc = getKycRecord(req.params.customerId);

  // Simulate KYC refresh logic
  const hasAllDocuments = documents && documents.length >= 2;
  const riskRating = hasAllDocuments ? 'low' : 'medium';
  const newStatus = hasAllDocuments ? 'approved' : 'pending';

  const kyc = updateKycRecord(req.params.customerId, {
    status: newStatus,
    level: level || existingKyc?.level || 'tier1',
    documents: documents || existingKyc?.documents || [],
    riskRating,
    pendingItems: hasAllDocuments ? [] : ['proof_of_address', 'income_statement']
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
 * /kyc/customers/{customerId}/check-approved:
 *   post:
 *     summary: Checker endpoint - Verify if KYC is approved
 *     description: Returns true/false indicating if the KYC is approved. Used for workflow conditional logic.
 *     tags: [KYC]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Checker response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckerResponse'
 */
router.post('/customers/:customerId/check-approved', (req, res) => {
  const kyc = getKycRecord(req.params.customerId);

  if (!kyc) {
    return res.json({
      result: false,
      reason: 'KYC record not found',
      metadata: { customerId: req.params.customerId },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  const isApproved = kyc.status === 'approved';
  
  res.json({
    result: isApproved,
    reason: isApproved 
      ? 'KYC is approved' 
      : `KYC status is: ${kyc.status}`,
    metadata: {
      customerId: kyc.customerId,
      status: kyc.status,
      level: kyc.level,
      riskRating: kyc.riskRating,
      pendingItems: kyc.pendingItems,
      verifiedAt: kyc.verifiedAt,
      expiresAt: kyc.expiresAt
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

export default router;
