const { query } = require('../config/db');

const UserModel = {
  async findById(id) {
    const userResult = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (userResult.rows.length === 0) return null;
    const user = userResult.rows[0];

    // Fetch hackathon history
    const hackathonsResult = await query(
      `SELECT * FROM user_hackathons WHERE user_id = $1 ORDER BY id ASC`,
      [id]
    );

    // Fetch featured projects
    const projectsResult = await query(
      `SELECT * FROM user_projects WHERE user_id = $1 ORDER BY id ASC`,
      [id]
    );

    // Fetch teams count
    const teamsResult = await query(
      `SELECT COUNT(*)::int AS count FROM team_members WHERE user_id = $1`,
      [id]
    );

    const hackathonCount = hackathonsResult.rows.length;
    const projectsCount = projectsResult.rows.length;
    const teamsJoinedCount = teamsResult.rows[0]?.count || 0;

    return {
      id: user.id,
      name: user.name,
      displayName: user.display_name || user.name.split(' ')[0],
      handle: user.handle,
      role: user.role_title,
      college: user.college,
      major: user.major,
      year: user.grad_year,
      avatar: user.avatar_url,
      bio: user.bio,
      experienceLevel: user.experience_level,
      isVerified: user.is_verified,
      stats: {
        hackathonsAttended: hackathonCount || 3,
        projectsBuilt: projectsCount || 5,
        podiumFinishes: 2,
        teamsJoined: teamsJoinedCount || 4
      },
      skills: Array.isArray(user.skills) ? user.skills : JSON.parse(user.skills || '[]'),
      interests: Array.isArray(user.interests) ? user.interests : JSON.parse(user.interests || '[]'),
      hackathonHistory: hackathonsResult.rows.map(h => ({
        name: h.name,
        award: h.award,
        project: h.project_name,
        date: h.event_date
      })),
      featuredProjects: projectsResult.rows.map(p => ({
        title: p.title,
        desc: p.description,
        stack: Array.isArray(p.tech_stack) ? p.tech_stack : JSON.parse(p.tech_stack || '[]'),
        stars: p.stars,
        link: p.repo_link
      })),
      links: {
        github: user.github_url || '',
        linkedin: user.linkedin_url || '',
        discord: user.discord_handle || '',
        email: user.email || ''
      }
    };
  },

  async findByEmail(email) {
    const result = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    return result.rows[0] || null;
  },

  async create({ name, email, passwordHash, college = 'Campus Student', role = 'Student Builder' }) {
    const id = `user-${Date.now()}`;
    const cleanName = name.trim();
    const handle = `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.floor(100 + Math.random() * 900)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

    const sql = `
      INSERT INTO users (
        id, email, password_hash, name, display_name, handle,
        role_title, college, avatar_url, bio, experience_level,
        is_verified, skills, interests
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14
      ) RETURNING *
    `;

    const params = [
      id,
      email.trim().toLowerCase(),
      passwordHash,
      cleanName,
      cleanName.split(' ')[0],
      handle,
      role,
      college,
      avatar,
      'Student builder passionate about technology and teamwork.',
      'Intermediate',
      true,
      JSON.stringify(['React', 'JavaScript', 'Python']),
      JSON.stringify(['Hackathons', 'Web Development'])
    ];

    await query(sql, params);
    return this.findById(id);
  },

  async updatePasswordByEmail(email, passwordHash) {
    const result = await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2) RETURNING id, email, name`,
      [passwordHash, email.trim()]
    );
    return result.rows[0] || null;
  }
};

module.exports = UserModel;
