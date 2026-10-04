const { query } = require('../config/db');

// Helper to format database row into frontend-compatible team request object
function formatRequestRow(row, members = []) {
  const membersNeeded = parseInt(row.members_needed, 10) || 4;
  const currentTeamSize = parseInt(row.current_team_size, 10) || 0;
  const ownerIncluded = row.owner_included !== undefined ? Boolean(row.owner_included) : true;
  const remainingSeats = Math.max(0, membersNeeded - currentTeamSize);

  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    category: row.category,
    eventName: row.event_name,
    shortDesc: row.short_desc,
    fullDesc: row.full_desc || row.short_desc,
    creator: {
      id: row.creator_id,
      name: row.creator_name || 'Anonymous Student',
      college: row.creator_college || 'Campus Member',
      avatar: row.creator_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: row.creator_role || 'Project Lead',
      bio: row.creator_bio || ''
    },
    skillsRequired: Array.isArray(row.skills_required) ? row.skills_required : JSON.parse(row.skills_required || '[]'),
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : JSON.parse(row.tech_stack || '[]'),
    membersNeeded,
    currentTeamSize,
    ownerIncluded,
    remainingSeats,
    openRoles: Array.isArray(row.open_roles) ? row.open_roles : JSON.parse(row.open_roles || '[]'),
    currentMembers: members.map(m => ({
      id: m.id,
      userId: m.user_id,
      name: m.name,
      role: m.role,
      college: m.college || 'Campus Student',
      avatar: m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
    })),
    experienceLevel: row.experience_level || 'Intermediate',
    deadline: row.deadline || '',
    deadlineDisplay: row.deadline_display || (row.deadline ? new Date(row.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'),
    daysLeft: parseInt(row.days_left, 10) || 14,
    urgent: Boolean(row.is_urgent),
    featured: Boolean(row.is_featured),
    requirements: Array.isArray(row.requirements) ? row.requirements : JSON.parse(row.requirements || '[]'),
    status: row.status || 'OPEN',
    createdAt: row.created_at
  };
}

const RequestModel = {
  async findAll({ category, search } = {}) {
    let sql = `
      SELECT 
        r.*,
        u.name AS creator_name,
        u.college AS creator_college,
        u.avatar_url AS creator_avatar,
        u.role_title AS creator_role,
        u.bio AS creator_bio
      FROM team_requests r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND r.category = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(r.title) LIKE $${params.length} OR
        LOWER(r.short_desc) LIKE $${params.length} OR
        LOWER(r.event_name) LIKE $${params.length} OR
        LOWER(u.name) LIKE $${params.length} OR
        LOWER(r.skills_required::text) LIKE $${params.length} OR
        LOWER(r.tech_stack::text) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY r.is_featured DESC, r.created_at DESC`;

    const result = await query(sql, params);
    if (result.rows.length === 0) return [];

    // Fetch all members for these requests
    const requestIds = result.rows.map(r => r.id);
    const membersResult = await query(
      `SELECT * FROM team_members WHERE request_id = ANY($1::varchar[]) ORDER BY id ASC`,
      [requestIds]
    );

    const membersByRequest = {};
    for (const m of membersResult.rows) {
      if (!membersByRequest[m.request_id]) membersByRequest[m.request_id] = [];
      membersByRequest[m.request_id].push(m);
    }

    return result.rows.map(row => formatRequestRow(row, membersByRequest[row.id] || []));
  },

  async findByCreatorId(creatorId) {
    const sql = `
      SELECT 
        r.*,
        u.name AS creator_name,
        u.college AS creator_college,
        u.avatar_url AS creator_avatar,
        u.role_title AS creator_role,
        u.bio AS creator_bio
      FROM team_requests r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.creator_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await query(sql, [creatorId]);
    if (result.rows.length === 0) return [];

    const requestIds = result.rows.map(r => r.id);
    const membersResult = await query(
      `SELECT * FROM team_members WHERE request_id = ANY($1::varchar[]) ORDER BY id ASC`,
      [requestIds]
    );

    const membersByRequest = {};
    for (const m of membersResult.rows) {
      if (!membersByRequest[m.request_id]) membersByRequest[m.request_id] = [];
      membersByRequest[m.request_id].push(m);
    }

    return result.rows.map(row => formatRequestRow(row, membersByRequest[row.id] || []));
  },

  async findByAssociatedUser(userId) {
    const sql = `
      SELECT 
        r.*,
        u.name AS creator_name,
        u.college AS creator_college,
        u.avatar_url AS creator_avatar,
        u.role_title AS creator_role,
        u.bio AS creator_bio
      FROM team_requests r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.creator_id = $1 OR r.id IN (SELECT request_id FROM team_members WHERE user_id = $1)
      ORDER BY r.created_at DESC
    `;
    const result = await query(sql, [userId]);
    if (result.rows.length === 0) {
      return { all: [], hosted: [], joined: [] };
    }

    const requestIds = result.rows.map(r => r.id);
    const membersResult = await query(
      `SELECT * FROM team_members WHERE request_id = ANY($1::varchar[]) ORDER BY id ASC`,
      [requestIds]
    );

    const membersByRequest = {};
    for (const m of membersResult.rows) {
      if (!membersByRequest[m.request_id]) membersByRequest[m.request_id] = [];
      membersByRequest[m.request_id].push(m);
    }

    const allFormatted = result.rows.map(row => formatRequestRow(row, membersByRequest[row.id] || []));

    const hosted = allFormatted.filter(r => String(r.creatorId) === String(userId) || String(r.creator?.id) === String(userId));
    const joined = allFormatted.filter(r => {
      const isLeader = String(r.creatorId) === String(userId) || String(r.creator?.id) === String(userId);
      const isMember = (r.currentMembers || []).some(m => String(m.userId) === String(userId));
      return isMember && !isLeader;
    });

    return {
      all: allFormatted,
      hosted,
      joined
    };
  },

  async findById(id) {
    const result = await query(
      `SELECT 
        r.*,
        u.name AS creator_name,
        u.college AS creator_college,
        u.avatar_url AS creator_avatar,
        u.role_title AS creator_role,
        u.bio AS creator_bio
      FROM team_requests r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const membersResult = await query(
      `SELECT * FROM team_members WHERE request_id = $1 ORDER BY id ASC`,
      [id]
    );

    return formatRequestRow(result.rows[0], membersResult.rows);
  },

  async create(data, creator) {
    const id = data.id || `req-${Date.now()}`;
    const deadlineDisplay = data.deadline
      ? new Date(data.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Flexible';

    const ownerIncluded = data.ownerIncluded !== undefined ? Boolean(data.ownerIncluded) : true;
    const membersNeeded = parseInt(data.membersNeeded, 10) || 4;
    const initialTeamSize = ownerIncluded ? 1 : 0;

    const insertSql = `
      INSERT INTO team_requests (
        id, creator_id, title, category, event_name, short_desc, full_desc,
        skills_required, tech_stack, members_needed, current_team_size,
        open_roles, experience_level, deadline, deadline_display, days_left,
        is_urgent, is_featured, requirements, status, owner_included
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      ) RETURNING *
    `;

    const params = [
      id,
      creator.id,
      data.title,
      data.category || 'Hackathons',
      data.eventName || (data.category === 'Hackathons' ? 'Upcoming Hackathon' : 'Campus Project'),
      data.shortDesc,
      data.fullDesc || data.shortDesc,
      JSON.stringify(data.skillsRequired || ['React', 'JavaScript']),
      JSON.stringify(data.techStack || ['React', 'Vite', 'CSS']),
      membersNeeded,
      initialTeamSize,
      JSON.stringify(data.openRoles || ['Frontend Developer']),
      data.experienceLevel || 'Intermediate',
      data.deadline || null,
      deadlineDisplay,
      14,
      false,
      true,
      JSON.stringify(data.requirements || ['Team player with good communication', 'Ready to hack during event days']),
      'OPEN',
      ownerIncluded
    ];

    await query(insertSql, params);

    // If owner is included, automatically add creator to team members
    if (ownerIncluded) {
      await query(
        `INSERT INTO team_members (request_id, user_id, name, role, college, avatar)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          creator.id,
          creator.name,
          'Team Lead',
          creator.college || 'Campus Student',
          creator.avatar_url || creator.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
        ]
      );
    }

    return this.findById(id);
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const shortDesc = data.shortDesc !== undefined ? data.shortDesc : existing.shortDesc;
    const fullDesc = data.fullDesc !== undefined ? data.fullDesc : existing.fullDesc;
    const category = data.category !== undefined ? data.category : existing.category;
    const eventName = data.eventName !== undefined ? data.eventName : existing.eventName;
    const skillsRequired = data.skillsRequired !== undefined ? data.skillsRequired : existing.skillsRequired;
    const techStack = data.techStack !== undefined ? data.techStack : existing.techStack;
    const membersNeeded = data.membersNeeded !== undefined ? parseInt(data.membersNeeded, 10) : existing.membersNeeded;
    const openRoles = data.openRoles !== undefined ? data.openRoles : existing.openRoles;
    const requirements = data.requirements !== undefined ? data.requirements : existing.requirements;
    const deadline = data.deadline !== undefined ? data.deadline : existing.deadline;
    const deadlineDisplay = deadline ? new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : existing.deadlineDisplay;

    const sql = `
      UPDATE team_requests
      SET title = $1, short_desc = $2, full_desc = $3, category = $4, event_name = $5,
          skills_required = $6, tech_stack = $7, members_needed = $8, open_roles = $9,
          requirements = $10, deadline = $11, deadline_display = $12,
          status = CASE WHEN current_team_size >= $8 THEN 'FULL' ELSE 'OPEN' END,
          updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const params = [
      title,
      shortDesc,
      fullDesc,
      category,
      eventName,
      JSON.stringify(skillsRequired),
      JSON.stringify(techStack),
      membersNeeded,
      JSON.stringify(openRoles),
      JSON.stringify(requirements),
      deadline || null,
      deadlineDisplay,
      id
    ];

    await query(sql, params);
    return this.findById(id);
  },

  async delete(id) {
    await query(`DELETE FROM team_requests WHERE id = $1`, [id]);
    return true;
  },

  async addTeamMember(requestId, { userId, name, role, college, avatar }) {
    // 1. Insert member into team_members
    await query(
      `INSERT INTO team_members (request_id, user_id, name, role, college, avatar)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        requestId,
        userId || null,
        name,
        role || 'Teammate',
        college || 'Campus Student',
        avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
      ]
    );

    // 2. Increment current_team_size and update status if full
    await query(
      `UPDATE team_requests
       SET current_team_size = current_team_size + 1,
           status = CASE WHEN current_team_size + 1 >= members_needed THEN 'FULL' ELSE status END
       WHERE id = $1`,
      [requestId]
    );

    // 3. Return updated request
    return this.findById(requestId);
  }
};

module.exports = RequestModel;
