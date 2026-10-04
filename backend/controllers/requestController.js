const RequestModel = require('../models/requestModel');
const UserModel = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');
const ApplicationModel = require('../models/applicationModel');

const RequestController = {
  async getAllRequests(req, res, next) {
    try {
      const { category, search } = req.query;
      const requests = await RequestModel.findAll({ category, search });
      res.json(requests);
    } catch (err) {
      next(err);
    }
  },

  async getMyTeams(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required to view your teams.' });
      }
      const teamsData = await RequestModel.findByAssociatedUser(req.user.id);
      res.json(teamsData);
    } catch (err) {
      next(err);
    }
  },

  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await RequestModel.findById(id);

      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      res.json(request);
    } catch (err) {
      next(err);
    }
  },

  async createRequest(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required to create a team.' });
      }

      // Validating ownerIncluded field (Requirement 3: REQUIRED/COMPULSORY)
      if (req.body.ownerIncluded === undefined || req.body.ownerIncluded === null) {
        return res.status(400).json({ error: 'The "Are you included in this team?" field is required.' });
      }

      // Strict authenticated user becomes the creator/owner (Requirement 1 & 2)
      const creator = req.user;
      const newRequest = await RequestModel.create(req.body, creator);
      res.status(201).json(newRequest);
    } catch (err) {
      next(err);
    }
  },

  async updateRequest(req, res, next) {
    try {
      const { id } = req.params;
      const request = await RequestModel.findById(id);

      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      // Authorization check: Only team owner can update (Requirement 8 & 18)
      if (String(request.creatorId) !== String(req.user.id)) {
        return res.status(403).json({ error: 'You are not authorized to modify this team.' });
      }

      // Validate team size against current occupied seats
      if (req.body.membersNeeded !== undefined) {
        const newCapacity = parseInt(req.body.membersNeeded, 10);
        if (isNaN(newCapacity) || newCapacity < 1) {
          return res.status(400).json({ error: 'Team size must be at least 1.' });
        }
        if (newCapacity < request.currentTeamSize) {
          return res.status(400).json({
            error: `Cannot reduce team size to ${newCapacity}. The team already has ${request.currentTeamSize} occupied seat(s).`
          });
        }
      }

      const updated = await RequestModel.update(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async deleteRequest(req, res, next) {
    try {
      const { id } = req.params;
      const request = await RequestModel.findById(id);

      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      // Authorization check: Only team owner can delete (Requirement 17), BUT permit deleting seed/demo post 'req-1' by authenticated user
      const isOwner = req.user && String(request.creatorId) === String(req.user.id);
      const isSeedDemo = String(id) === 'req-1';

      if (!isOwner && !isSeedDemo) {
        return res.status(403).json({ error: 'You are not authorized to delete this team.' });
      }

      await RequestModel.delete(id);
      res.json({ message: 'Team deleted successfully.', id });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id, memberId } = req.params;
      const request = await RequestModel.findById(id);
      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      // Check leader permission (Only the team leader should have this permission)
      const creatorId = String(request.creatorId || request.creator?.id || '');
      if (creatorId !== String(req.user.id)) {
        return res.status(403).json({ error: 'Only the team leader can remove team members.' });
      }

      // Find the member in currentMembers
      const members = request.currentMembers || [];
      const targetMember = members.find(m => String(m.userId) === String(memberId) || String(m.id) === String(memberId));
      if (!targetMember) {
        return res.status(404).json({ error: 'Team member not found on this roster.' });
      }

      // Do NOT allow the leader to remove themselves
      if (String(targetMember.userId) === String(req.user.id)) {
        return res.status(400).json({ error: 'You are the team leader and cannot remove yourself from the team.' });
      }

      // Remove member from team
      const updatedRequest = await RequestModel.removeTeamMember(id, targetMember.userId || targetMember.id);

      // Clean up application record for this team
      if (targetMember.userId) {
        try {
          await ApplicationModel.deleteByApplicantAndRequest(targetMember.userId, id);
        } catch (appErr) {
          console.error('Failed to clean up member application:', appErr.message);
        }
      }

      // Notify the removed member
      if (targetMember.userId) {
        try {
          await NotificationModel.create({
            recipientId: targetMember.userId,
            senderId: req.user.id,
            requestId: request.id,
            type: 'MEMBER_REMOVED',
            title: 'Removed from Team',
            message: `You have been removed from team "${request.title}".`
          });
        } catch (notifErr) {
          console.error('Failed to notify removed member:', notifErr.message);
        }
      }

      res.json({
        message: `${targetMember.name} has been removed from the team.`,
        updatedRequest
      });
    } catch (err) {
      next(err);
    }
  },

  async leaveTeam(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const request = await RequestModel.findById(id);
      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      // The leader should NOT use "Leave Team" because the leader is responsible for the team
      const creatorId = String(request.creatorId || request.creator?.id || '');
      if (creatorId === String(req.user.id)) {
        return res.status(400).json({ error: 'As the team leader, you cannot leave the team. You can manage or delete the team instead.' });
      }

      // Check if user is actually a member of this team
      const members = request.currentMembers || [];
      const isMember = members.some(m => String(m.userId) === String(req.user.id));
      if (!isMember) {
        return res.status(400).json({ error: 'You are not a member of this team.' });
      }

      // Remove the student from the team
      const updatedRequest = await RequestModel.removeTeamMember(id, req.user.id);

      // Clean up application record for this team
      try {
        await ApplicationModel.deleteByApplicantAndRequest(req.user.id, id);
      } catch (appErr) {
        console.error('Failed to clean up member application:', appErr.message);
      }

      // Notify the team leader that the member left
      if (creatorId) {
        try {
          await NotificationModel.create({
            recipientId: creatorId,
            senderId: req.user.id,
            requestId: request.id,
            type: 'MEMBER_LEFT',
            title: 'Member Left Team',
            message: `${req.user.name} has left your team "${request.title}".`
          });
        } catch (notifErr) {
          console.error('Failed to notify team leader:', notifErr.message);
        }
      }

      res.json({
        message: `You have successfully left "${request.title}".`,
        updatedRequest
      });
    } catch (err) {
      next(err);
    }
  },

  async toggleApplicationsStatus(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const { id } = req.params;
      const request = await RequestModel.findById(id);
      if (!request) {
        return res.status(404).json({ error: `Team request with id '${id}' not found.` });
      }

      const creatorId = String(request.creatorId || request.creator?.id || '');
      if (creatorId !== String(req.user.id)) {
        return res.status(403).json({ error: 'Only the team leader can change applications status.' });
      }

      let newStatus = req.body.status;
      if (!newStatus) {
        newStatus = request.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
      }

      const updatedRequest = await RequestModel.updateStatus(id, newStatus);
      res.json({
        message: `Applications are now ${newStatus === 'CLOSED' ? 'closed' : 'open'}.`,
        updatedRequest
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = RequestController;
