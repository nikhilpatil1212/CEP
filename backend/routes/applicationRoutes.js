const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const { validateCreateApplication } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// GET /api/applications/my-applications - Get submitted applications for authenticated user
router.get('/my-applications', authenticateToken, ApplicationController.getMyApplications);

// GET /api/applications/notifications - Legacy pending applications for team owner
router.get('/notifications', authenticateToken, ApplicationController.getOwnerNotifications);

// POST /api/applications - Direct application creation (Protected)
router.post('/', authenticateToken, validateCreateApplication, ApplicationController.createApplication);

// PATCH /api/applications/:id/accept or /approve - Accept an application and add applicant to roster
router.patch('/:id/accept', authenticateToken, ApplicationController.acceptApplication);
router.patch('/:id/approve', authenticateToken, ApplicationController.acceptApplication);

// PATCH /api/applications/:id/reject or /deny - Decline an application
router.patch('/:id/reject', authenticateToken, ApplicationController.rejectApplication);
router.patch('/:id/deny', authenticateToken, ApplicationController.rejectApplication);

// PATCH /api/applications/:id/withdraw - Applicant cancels/withdraws pending application
router.patch('/:id/withdraw', authenticateToken, ApplicationController.withdrawApplication);

// DELETE /api/applications/:id - Delete / remove an application (Applicant or Team Owner)
router.delete('/:id', authenticateToken, ApplicationController.deleteApplication);

module.exports = router;
