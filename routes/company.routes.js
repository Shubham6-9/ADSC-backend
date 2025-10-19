import express from 'express';
import * as companyController from '../controllers/company.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get all companies for user
router.get('/my-companies', authMiddleware, companyController.getUserCompanies);

// Get available company types
router.get('/types', authMiddleware, companyController.getCompanyTypes);

// Create new company
router.post('/create', authMiddleware, companyController.createCompany);

// Make investment
router.post('/invest', authMiddleware, companyController.makeInvestment);

// Claim daily income
router.post('/claim-income', authMiddleware, companyController.claimIncome);

// Pay tax
router.post('/pay-tax', authMiddleware, companyController.payTax);

// Unlock new slot
router.post('/unlock-slot', authMiddleware, companyController.unlockSlot);

// Get company stats
router.get('/stats/:companyId', authMiddleware, companyController.getCompanyStats);

// Upgrade company
router.post('/upgrade', authMiddleware, companyController.upgradeCompany);

export default router;
