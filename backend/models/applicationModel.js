const { query } = require('../config/db');

const ApplicationModel = {
  async create(data) {
    const id = `app-${Date.now()}`;
    const sql = `
      INSERT INTO applications (
        id, request_id, applicant_id, applicant_name, applicant_email,
        applicant_college, applicant_avatar, role_applied,
        pitch, portfolio_link, hours_commitment, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const params = [
      id,
      data.requestId,
      data.applicantId || null,
      data.applicantName,
      data.applicantEmail || null,
      data.applicantCollege || null,
      data.applicantAvatar || null,
      data.roleApplied,
      data.pitch,
      data.portfolioLink || null,
      data.hoursCommitment || '10-15 hrs/week',
      'PENDING'
    ];

    const result = await query(sql, params);
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByRequestId(requestId) {
    const result = await query(
      `SELECT * FROM applications WHERE request_id = $1 ORDER BY created_at DESC`,
      [requestId]
    );
    return result.rows;
  },

  async findByOwnerId(ownerId) {
    const sql = `
      SELECT 
        a.*, 
        r.title AS request_title, 
        r.event_name,
        r.creator_id
      FROM applications a
      JOIN team_requests r ON a.request_id = r.id
      WHERE r.creator_id = $1 AND a.status = 'PENDING'
      ORDER BY a.created_at DESC
    `;
    const result = await query(sql, [ownerId]);
    return result.rows;
  },

  async findByApplicantId(applicantId) {
    const sql = `
      SELECT 
        a.*, 
        r.title AS request_title, 
        r.event_name,
        r.category,
        r.members_needed,
        r.current_team_size,
        r.creator_id
      FROM applications a
      JOIN team_requests r ON a.request_id = r.id
      WHERE a.applicant_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await query(sql, [applicantId]);
    return result.rows;
  },

  async findByApplicantAndRequest(applicantId, requestId) {
    const sql = `
      SELECT * FROM applications
      WHERE applicant_id = $1 AND request_id = $2
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [applicantId, requestId]);
    return result.rows[0] || null;
  },

  async findActiveByApplicantAndRequest(applicantId, requestId) {
    const sql = `
      SELECT * FROM applications
      WHERE applicant_id = $1 AND request_id = $2
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [applicantId, requestId]);
    // Active means PENDING or APPROVED or ACCEPTED
    const active = result.rows.find(a => a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'ACCEPTED');
    return active || null;
  },

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query(
      `DELETE FROM applications WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  async deleteByApplicantAndRequest(applicantId, requestId) {
    const result = await query(
      `DELETE FROM applications WHERE applicant_id = $1 AND request_id = $2 RETURNING *`,
      [applicantId, requestId]
    );
    return result.rows;
  }
};

module.exports = ApplicationModel;
