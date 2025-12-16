import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import accountsRoutes from './routes/accounts.js';
import transactionsRoutes from './routes/transactions.js';
import paymentsRoutes from './routes/payments.js';
import loansRoutes from './routes/loans.js';
import airtimeRoutes from './routes/airtime.js';
import kycRoutes from './routes/kyc.js';
import limitsRoutes from './routes/limits.js';
import fxRoutes from './routes/fx.js';
import treasuryRoutes from './routes/treasury.js';
import groupsRoutes from './routes/groups.js';
import campaignsRoutes from './routes/campaigns.js';
import authRoutes from './routes/auth.js';
import walletsRoutes from './routes/wallets.js';
import contributionsRoutes from './routes/contributions.js';
import changoKycRoutes from './routes/chango-kyc.js';
import cashoutsRoutes from './routes/cashouts.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${requestId}`);
  next();
});

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Fintech Agent API Documentation'
}));

// Routes
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

app.use('/accounts', accountsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/loans', loansRoutes);
app.use('/airtime', airtimeRoutes);
app.use('/kyc', kycRoutes);
app.use('/limits', limitsRoutes);
app.use('/fx', fxRoutes);
app.use('/treasury', treasuryRoutes);
app.use('/chango/groups', groupsRoutes);
app.use('/chango/campaigns', campaignsRoutes);
app.use('/chango/auth', authRoutes);
app.use('/chango/wallets', walletsRoutes);
app.use('/chango/contributions', contributionsRoutes);
app.use('/chango/kyc', changoKycRoutes);
app.use('/chango/cashout', cashoutsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.requestId}:`, err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Fintech Agent API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/docs`);
});

