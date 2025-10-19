import express from 'express';
import * as companyController from '../controllers/company.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all companies for user
router.get('/my-companies', auth, companyController.getUserCompanies);

// Get available company types
router.get('/types', auth, companyController.getCompanyTypes);

// Create new company
router.post('/create', auth, companyController.createCompany);

// Make investment
router.post('/invest', auth, companyController.makeInvestment);

// Claim daily income
router.post('/claim-income', auth, companyController.claimIncome);

// Pay tax
router.post('/pay-tax', auth, companyController.payTax);

// Unlock new slot
router.post('/unlock-slot', auth, companyController.unlockSlot);

// Get company stats
router.get('/stats/:companyId', auth, companyController.getCompanyStats);

// Upgrade company
router.post('/upgrade', auth, companyController.upgradeCompany);

export default router;
