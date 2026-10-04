// Request body validation middleware

function validateCreateRequest(req, res, next) {
  const { title, shortDesc } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Project or hackathon title is required.' });
  }

  if (!shortDesc || typeof shortDesc !== 'string' || !shortDesc.trim()) {
    return res.status(400).json({ error: 'Short description is required.' });
  }

  next();
}

function validateCreateApplication(req, res, next) {
  const { roleApplied, pitch } = req.body;

  if (!roleApplied || typeof roleApplied !== 'string' || !roleApplied.trim()) {
    return res.status(400).json({ error: 'Role applied for is required.' });
  }

  if (!pitch || typeof pitch !== 'string' || !pitch.trim()) {
    return res.status(400).json({ error: 'Application pitch is required.' });
  }

  next();
}

module.exports = {
  validateCreateRequest,
  validateCreateApplication
};
