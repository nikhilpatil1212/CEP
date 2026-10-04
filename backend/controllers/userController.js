const UserModel = require('../models/userModel');

const UserController = {
  async getCurrentUser(req, res, next) {
    try {
      const user = await UserModel.findById('user-onkar');
      if (!user) {
        return res.status(404).json({ error: 'Default user profile not found.' });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: `User with id '${id}' not found.` });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = UserController;
