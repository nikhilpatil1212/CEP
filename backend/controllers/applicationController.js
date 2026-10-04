const ApplicationModel = require('../models/applicationModel');
const RequestModel = require('../models/requestModel');
const UserModel = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');

const ApplicationController = {
  /**
   * Submit an application for a team request
   * Applicant identity is strictly derived from authenticated req.user
   */
  async createApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'You must be logged in to apply for a team.' });
      }

      const requestId = req.params.requestId || req.body.requestId;
      if (!requestId) {
        return res.status(400).json({ error: 'Team request ID is required.' });
      }

      const request = await RequestModel.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: `Team request with id '${requestId}' not found.` });
      }

      // Check remaining seats - do not allow applications if full
      const remainingSeats = Math.max(0, request.membersNeeded - request.currentTeamSize);
      if (remainingSeats <= 0 || request.status === 'FULL') {
        return res.status(400).json({ error: 'This team roster is already full. No remaining seats.' });
      }

      // Check if team is closed
      if (request.status === 'CLOSED') {
        return res.status(400).json({ error: 'Applications are closed for this team.' });
      }

      const applicantId = String(req.user.id);
      const creatorId = String(request.creatorId || request.creator?.id || '');

      // Prevent creator from applying to their own team
      if (applicantId === creatorId) {
        return res.status(400).json({ error: 'You are the creator of this team request and cannot apply to your own team.' });
      }

      // Check if user is already an approved member
      if (request.members && request.members.some(m => String(m.userId || m.user_id) === applicantId)) {
        return res.status(400).json({ error: 'You are already an approved member of this team.' });
      }

      // Check for existing application (Requirement 2 & 4: Strict duplicate prevention, allow re-apply if withdrawn)
      const existingApp = await ApplicationModel.findByApplicantAndRequest(req.user.id, requestId);
      if (existingApp && existingApp.status !== 'WITHDRAWN') {
        return res.status(400).json({
          error: 'You have already applied to this team.'
        });
      }
      if (existingApp && existingApp.status === 'WITHDRAWN') {
        await ApplicationModel.delete(existingApp.id);
      }

      // Strictly build application using authenticated user's identity
      const applicationData = {
        requestId,
        applicantId: req.user.id,
        applicantName: req.user.name || 'Campus Student',
        applicantEmail: req.user.email || req.user.links?.email || null,
        applicantCollege: req.user.college || 'Campus Member',
        applicantAvatar: req.user.avatar || req.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
        roleApplied: req.body.roleApplied || 'Teammate',
        pitch: req.body.pitch || '',
        portfolioLink: req.body.portfolioLink || req.user.links?.github || null,
        hoursCommitment: req.body.hoursCommitment || '10-15 hrs/week'
      };

      const application = await ApplicationModel.create(applicationData);

      // Send notification to the TEAM LEADER / OWNER
      try {
        const leaderId = request.creatorId || request.creator?.id;
        if (leaderId) {
          await NotificationModel.create({
            recipientId: leaderId,
            senderId: req.user.id,
            requestId: request.id,
            applicationId: application.id,
            type: 'NEW_APPLICATION',
            title: 'New Team Application',
            message: `${req.user.name} has applied to join your team "${request.title}".`
          });
        }
      } catch (notifErr) {
        console.error('Failed to create application notification:', notifErr.message);
      }

      res.status(201).json({
        message: 'Application submitted successfully',
        application
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get applications for a specific team
   * Restricted: Only the team owner is authorized to view private incoming applications
   */
  async getApplicationsByRequest(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { requestId } = req.params;
      const request = await RequestModel.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: `Team request with id '${requestId}' not found.` });
      }

      const creatorId = String(request.creatorId || request.creator?.id || '');
      const userId = String(req.user.id);

      if (creatorId !== userId) {
        return res.status(403).json({ error: 'You are not authorized to view applications for this team.' });
      }

      const applications = await ApplicationModel.findByRequestId(requestId);
      res.json(applications);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all applications submitted by the authenticated user (My Applications)
   */
  async getMyApplications(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const applications = await ApplicationModel.findByApplicantId(req.user.id);
      res.json(applications);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Legacy owner notifications (kept for backwards compatibility)
   */
  async getOwnerNotifications(req, res, next) {
    try {
      const ownerId = req.user.id;
      const applications = await ApplicationModel.findByOwnerId(ownerId);
      res.json({
        count: applications.length,
        applications
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Team owner approves a pending application
   * - Verifies owner identity
   * - Verifies application is PENDING
   * - Verifies remaining seat availability (atomic/concurrency safe)
   * - Sets status to APPROVED
   * - Adds applicant to team roster
   * - Sends notification to applicant
   */
  async acceptApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({ error: `Application with id '${id}' not found.` });
      }

      if (application.status !== 'PENDING') {
        return res.status(400).json({ error: `Application cannot be approved because it is currently ${application.status}.` });
      }

      const request = await RequestModel.findById(application.request_id);
      if (!request) {
        return res.status(404).json({ error: 'Associated team request not found.' });
      }

      // Check owner permission
      const creatorId = String(request.creatorId || request.creator?.id || '');
      const userId = String(req.user.id);
      if (creatorId !== userId) {
        return res.status(403).json({ error: 'You are not authorized to approve applications for this team.' });
      }

      // Check if team has available seats
      const remainingSeats = Math.max(0, request.membersNeeded - request.currentTeamSize);
      if (remainingSeats <= 0) {
        return res.status(400).json({ error: 'This team roster is already full. No remaining seats.' });
      }

      // 1. Add applicant as official team member
      const updatedRequest = await RequestModel.addTeamMember(application.request_id, {
        userId: application.applicant_id,
        name: application.applicant_name,
        role: application.role_applied,
        college: application.applicant_college,
        avatar: application.applicant_avatar
      });

      // 2. Update application status to APPROVED
      const updatedApp = await ApplicationModel.updateStatus(id, 'APPROVED');

      // 3. Send notification to the APPLICANT (Student B)
      if (application.applicant_id) {
        try {
          await NotificationModel.create({
            recipientId: application.applicant_id,
            senderId: req.user.id,
            requestId: application.request_id,
            applicationId: application.id,
            type: 'APPLICATION_APPROVED',
            title: 'Application Accepted! 🎉',
            message: `Congratulations! Your application to join "${request.title}" has been approved. You are now an official team member!`
          });
        } catch (notifErr) {
          console.error('Failed to create approval notification:', notifErr.message);
        }
      }

      // 4. Send notification to other existing team members that a new teammate joined
      const existingMembers = request.currentMembers || [];
      for (const m of existingMembers) {
        const mUserId = m.userId || m.user_id;
        if (mUserId && String(mUserId) !== String(req.user.id) && String(mUserId) !== String(application.applicant_id)) {
          try {
            await NotificationModel.create({
              recipientId: mUserId,
              senderId: req.user.id,
              requestId: application.request_id,
              applicationId: application.id,
              type: 'NEW_MEMBER_JOINED',
              title: 'New Teammate Joined',
              message: `${application.applicant_name} has joined "${request.title}".`
            });
          } catch (notifErr) {
            console.error('Failed to notify existing team member:', notifErr.message);
          }
        }
      }

      res.json({
        message: `${application.applicant_name} has been added to your team roster!`,
        application: updatedApp,
        updatedRequest
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Team owner denies a pending application
   * - Verifies owner identity
   * - Verifies application is PENDING
   * - Sets status to DENIED
   * - Does NOT occupy seats
   * - Sends notification to applicant
   */
  async rejectApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({ error: `Application with id '${id}' not found.` });
      }

      if (application.status !== 'PENDING') {
        return res.status(400).json({ error: `Application cannot be denied because it is currently ${application.status}.` });
      }

      const request = await RequestModel.findById(application.request_id);
      if (!request) {
        return res.status(404).json({ error: 'Associated team request not found.' });
      }

      // Check owner permission
      const creatorId = String(request.creatorId || request.creator?.id || '');
      const userId = String(req.user.id);
      if (creatorId !== userId) {
        return res.status(403).json({ error: 'You are not authorized to manage applications for this team.' });
      }

      // Update application status to DENIED
      const updatedApp = await ApplicationModel.updateStatus(id, 'DENIED');

      // Send notification to the APPLICANT (Student B)
      if (application.applicant_id) {
        try {
          await NotificationModel.create({
            recipientId: application.applicant_id,
            senderId: req.user.id,
            requestId: application.request_id,
            applicationId: application.id,
            type: 'APPLICATION_DENIED',
            title: 'Application Update',
            message: `Your application to join ${request.title} was not accepted.`
          });
        } catch (notifErr) {
          console.error('Failed to create denial notification:', notifErr.message);
        }
      }

      res.json({
        message: 'Application denied.',
        application: updatedApp
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Applicant withdraws their own pending application
   * - Verifies applicant identity
   * - Verifies application is PENDING
   * - Sets status to WITHDRAWN
   */
  async withdrawApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({ error: `Application with id '${id}' not found.` });
      }

      // Verify that authenticated user is the applicant
      if (String(application.applicant_id) !== String(req.user.id)) {
        return res.status(403).json({ error: 'You are not authorized to withdraw this application.' });
      }

      if (application.status !== 'PENDING') {
        return res.status(400).json({ error: `Only pending applications can be withdrawn (current status: ${application.status}).` });
      }

      // Update status to WITHDRAWN
      const updatedApp = await ApplicationModel.updateStatus(id, 'WITHDRAWN');

      res.json({
        message: 'Application withdrawn successfully.',
        application: updatedApp
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete / remove an application
   * - Authorized for the applicant (who created it) OR the team owner (who received it)
   */
  async deleteApplication(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const application = await ApplicationModel.findById(id);
      if (!application) {
        return res.status(404).json({ error: `Application with id '${id}' not found.` });
      }

      const request = await RequestModel.findById(application.request_id);
      const isApplicant = String(application.applicant_id) === String(req.user.id);
      const isTeamOwner = request && (String(request.creatorId) === String(req.user.id) || String(request.creator?.id) === String(req.user.id));

      if (!isApplicant && !isTeamOwner) {
        return res.status(403).json({ error: 'You are not authorized to delete this application.' });
      }

      await ApplicationModel.delete(id);

      res.json({
        message: 'Application removed successfully.',
        id
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ApplicationController;
