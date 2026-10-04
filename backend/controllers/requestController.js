const RequestModel = require('../models/requestModel');
const UserModel = require('../models/userModel');

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
  }
};

module.exports = RequestController;
