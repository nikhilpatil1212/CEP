const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const ApplicationController = require('../controllers/applicationController');
const { validateCreateRequest, validateCreateApplication } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// GET /api/requests - Get all requests (optional query: ?category=...&search=...)
router.get('/', RequestController.getAllRequests);

// GET /api/requests/my-teams - Get teams owned by authenticated user (Protected)
// Must be declared before /:id to prevent route clash
router.get('/my-teams', authenticateToken, RequestController.getMyTeams);

// GET /api/requests/:id - Get single request details
router.get('/:id', RequestController.getRequestById);

// POST /api/requests - Create a new team request (Protected)
router.post('/', authenticateToken, validateCreateRequest, RequestController.createRequest);

// PUT /api/requests/:id - Update team details (Protected, Owner only)
router.put('/:id', authenticateToken, RequestController.updateRequest);

// DELETE /api/requests/:id - Delete team (Protected, Owner only)
router.delete('/:id', authenticateToken, RequestController.deleteRequest);

// DELETE /api/requests/:id/members/:memberId - Leader removes a team member (Protected, Leader only)
router.delete('/:id/members/:memberId', authenticateToken, RequestController.removeMember);

// POST /api/requests/:id/leave - Member leaves team (Protected, Member only)
router.post('/:id/leave', authenticateToken, RequestController.leaveTeam);

// PATCH /api/requests/:id/status - Toggle team applications status OPEN / CLOSED (Protected, Leader only)
router.patch('/:id/status', authenticateToken, RequestController.toggleApplicationsStatus);

// POST /api/requests/:requestId/applications - Submit an application for a team request (Protected)
router.post('/:requestId/applications', authenticateToken, validateCreateApplication, ApplicationController.createApplication);

// GET /api/requests/:requestId/applications - Get all applications for a team request (Protected, Owner only)
router.get('/:requestId/applications', authenticateToken, ApplicationController.getApplicationsByRequest);

module.exports = router;
