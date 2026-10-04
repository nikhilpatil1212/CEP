const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let usePostgres = false;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  database: process.env.PGDATABASE || 'campusconnect_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  connectionTimeoutMillis: 1500
});

pool.on('error', (err) => {
  // Suppress idle client error if falling back
  if (usePostgres) {
    console.error('Unexpected error on idle PostgreSQL client', err.message);
  }
});

// Test connection on launch
pool.connect()
  .then(client => {
    usePostgres = true;
    console.log('✅ PostgreSQL connected successfully to', process.env.PGDATABASE || 'campusconnect_db');
    client.release();
  })
  .catch(err => {
    usePostgres = false;
    console.warn(`⚠️ PostgreSQL connection not detected (${err.message}).`);
    console.log('💡 Running backend in resilient In-Memory Store mode with pre-seeded student data.');
  });

// -------------------------------------------------------------
// In-Memory Fallback Store (Used when PostgreSQL is not running)
// -------------------------------------------------------------
const memoryStore = {
  users: [
    {
      id: 'user-onkar',
      email: 'onkar.patil@pict.edu',
      password_hash: bcrypt.hashSync('Password123!', 10),
      name: 'Onkar Patil',
      display_name: 'Onkar',
      handle: '@onkar_dev',
      role_title: 'Full-Stack Developer & UI Enthusiast',
      college: 'PICT Pune',
      major: 'B.E. Computer Engineering',
      grad_year: '3rd Year (Class of 2027)',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: '3rd year Computer Engineering student at PICT Pune. Passionate about web development, hackathons, and building accessible tech solutions for students and communities.',
      experience_level: 'Intermediate',
      is_verified: true,
      skills: ['React', 'JavaScript', 'Node.js', 'Python', 'FastAPI', 'Tailwind CSS', 'MongoDB', 'Git'],
      interests: ['Hackathons', 'Full-Stack Web', 'AI Tools', 'Open Source'],
      github_url: 'https://github.com',
      linkedin_url: 'https://linkedin.com',
      discord_handle: 'onkar_dev#5012',
      created_at: new Date()
    }
  ],
  user_hackathons: [
    {
      id: 1,
      user_id: 'user-onkar',
      name: 'Smart India Hackathon (SIH 2025)',
      award: '🏆 1st Prize - Software Edition',
      project_name: 'KisanMitra - Smart Advisory for Rural Farmers',
      event_date: 'Dec 2025'
    },
    {
      id: 2,
      user_id: 'user-onkar',
      name: 'HackNITK 2025',
      award: '🥈 2nd Place - Open Innovation Track',
      project_name: 'CampusBite - Mess & Canteen Queue Tracker',
      event_date: 'Sept 2025'
    }
  ],
  user_projects: [
    {
      id: 1,
      user_id: 'user-onkar',
      title: 'KisanMitra Advisory',
      description: 'Vernacular crop health assistant and mandi price predictor built for rural communities.',
      tech_stack: ['React', 'FastAPI', 'PyTorch', 'Tailwind'],
      stars: '64',
      repo_link: 'github.com/onkar-dev/kisan-mitra'
    },
    {
      id: 2,
      user_id: 'user-onkar',
      title: 'CollegeClub Portal',
      description: 'Centralized club recruitment and event registration portal for campus students.',
      tech_stack: ['React', 'Node.js', 'MongoDB'],
      stars: '38',
      repo_link: 'github.com/onkar-dev/college-club'
    }
  ],
  team_requests: [],
  team_members: [],
  applications: [],
  notifications: []
};

// Simple in-memory query handler
async function handleMemoryQuery(text, params = []) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE id = $1
  if (normalized.startsWith('select * from users where id = $1')) {
    const user = memoryStore.users.find(u => u.id === params[0]);
    return { rows: user ? [user] : [] };
  }

  // 2. SELECT * FROM users WHERE LOWER(email) = LOWER($1)
  if (normalized.includes('from users where lower(email) = lower($1)')) {
    const user = memoryStore.users.find(u => u.email.toLowerCase() === params[0].toLowerCase());
    return { rows: user ? [user] : [] };
  }

  // 3. INSERT INTO users
  if (normalized.startsWith('insert into users')) {
    const newUser = {
      id: params[0],
      email: params[1],
      password_hash: params[2],
      name: params[3],
      display_name: params[4],
      handle: params[5],
      role_title: params[6],
      college: params[7],
      avatar_url: params[8],
      bio: params[9],
      experience_level: params[10],
      is_verified: params[11],
      skills: typeof params[12] === 'string' ? JSON.parse(params[12]) : params[12],
      interests: typeof params[13] === 'string' ? JSON.parse(params[13]) : params[13],
      github_url: 'https://github.com',
      linkedin_url: 'https://linkedin.com',
      discord_handle: '',
      created_at: new Date()
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  // 3b. UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)
  if (normalized.includes('update users set password_hash')) {
    const user = memoryStore.users.find(u => u.email.toLowerCase() === params[1].toLowerCase());
    if (user) {
      user.password_hash = params[0];
      user.updated_at = new Date();
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // 4. SELECT * FROM user_hackathons WHERE user_id = $1
  if (normalized.includes('from user_hackathons where user_id = $1')) {
    const items = memoryStore.user_hackathons.filter(h => h.user_id === params[0]);
    return { rows: items };
  }

  // 5. SELECT * FROM user_projects WHERE user_id = $1
  if (normalized.includes('from user_projects where user_id = $1')) {
    const items = memoryStore.user_projects.filter(p => p.user_id === params[0]);
    return { rows: items };
  }

  // 6. SELECT COUNT(*)::int AS count FROM team_members WHERE user_id = $1
  if (normalized.includes('count(*)') && normalized.includes('from team_members where user_id = $1')) {
    const count = memoryStore.team_members.filter(m => m.user_id === params[0]).length;
    return { rows: [{ count }] };
  }

  // 7. SELECT r.*, u.name AS creator_name FROM team_requests r WHERE r.id = $1
  if (normalized.includes('from team_requests r') && normalized.includes('where r.id = $1')) {
    const r = memoryStore.team_requests.find(req => req.id === params[0]);
    if (!r) return { rows: [] };
    const u = memoryStore.users.find(usr => usr.id === r.creator_id) || {};
    return {
      rows: [{
        ...r,
        creator_name: u.name || 'Campus Student',
        creator_college: u.college || 'PICT Pune',
        creator_avatar: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        creator_role: u.role_title || 'Project Lead',
        creator_bio: u.bio || ''
      }]
    };
  }

  // 7b. SELECT r.* FROM team_requests r WHERE r.creator_id = $1 OR r.id IN (...) (My Teams All/Hosted/Joined)
  if (normalized.includes('from team_requests r') && (normalized.includes('r.creator_id = $1 or') || normalized.includes('team_members where user_id = $1'))) {
    const userId = params[0];
    const memberRequestIds = memoryStore.team_members.filter(m => m.user_id === userId).map(m => m.request_id);
    const requests = memoryStore.team_requests.filter(r => r.creator_id === userId || memberRequestIds.includes(r.id));
    const rows = requests.map(r => {
      const u = memoryStore.users.find(usr => usr.id === r.creator_id) || {};
      return {
        ...r,
        creator_name: u.name || 'Campus Student',
        creator_college: u.college || 'PICT Pune',
        creator_avatar: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        creator_role: u.role_title || 'Project Lead',
        creator_bio: u.bio || ''
      };
    });
    return { rows };
  }

  // 7c. SELECT r.* FROM team_requests r WHERE r.creator_id = $1 (My Teams - Hosted only)
  if (normalized.includes('from team_requests r') && normalized.includes('r.creator_id = $1')) {
    const creatorId = params[0];
    const requests = memoryStore.team_requests.filter(r => r.creator_id === creatorId);
    const rows = requests.map(r => {
      const u = memoryStore.users.find(usr => usr.id === r.creator_id) || {};
      return {
        ...r,
        creator_name: u.name || 'Campus Student',
        creator_college: u.college || 'PICT Pune',
        creator_avatar: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        creator_role: u.role_title || 'Project Lead',
        creator_bio: u.bio || ''
      };
    });
    return { rows };
  }

  if (normalized.includes('from team_requests r')) {
    let requests = [...memoryStore.team_requests];

    if (params.length > 0 && text.includes('category = $')) {
      const catParam = params[0];
      requests = requests.filter(r => r.category === catParam);
    }

    const rows = requests.map(r => {
      const u = memoryStore.users.find(usr => usr.id === r.creator_id) || {};
      return {
        ...r,
        creator_name: u.name || 'Campus Student',
        creator_college: u.college || 'PICT Pune',
        creator_avatar: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        creator_role: u.role_title || 'Project Lead',
        creator_bio: u.bio || ''
      };
    });

    return { rows };
  }

  // 8. SELECT * FROM team_members WHERE request_id = $1 OR request_id = ANY(...)
  if (normalized.includes('from team_members where request_id = $1')) {
    const members = memoryStore.team_members.filter(m => m.request_id === params[0]);
    return { rows: members };
  }

  if (normalized.includes('from team_members where request_id = any(')) {
    const ids = params[0] || [];
    const members = memoryStore.team_members.filter(m => ids.includes(m.request_id));
    return { rows: members };
  }

  // 9. INSERT INTO team_requests
  if (normalized.startsWith('insert into team_requests')) {
    const newReq = {
      id: params[0],
      creator_id: params[1],
      title: params[2],
      category: params[3],
      event_name: params[4],
      short_desc: params[5],
      full_desc: params[6],
      skills_required: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
      tech_stack: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      members_needed: params[9],
      current_team_size: params[10],
      open_roles: typeof params[11] === 'string' ? JSON.parse(params[11]) : params[11],
      experience_level: params[12],
      deadline: params[13],
      deadline_display: params[14],
      days_left: params[15],
      is_urgent: params[16],
      is_featured: params[17],
      requirements: typeof params[18] === 'string' ? JSON.parse(params[18]) : params[18],
      status: params[19],
      owner_included: params[20] !== undefined ? Boolean(params[20]) : true,
      created_at: new Date()
    };
    memoryStore.team_requests.unshift(newReq);
    return { rows: [newReq] };
  }

  // 9b. UPDATE team_requests SET title = $1 ... WHERE id = $13
  if (normalized.startsWith('update team_requests set title = $1')) {
    const id = params[12];
    const req = memoryStore.team_requests.find(r => r.id === id);
    if (req) {
      req.title = params[0];
      req.short_desc = params[1];
      req.full_desc = params[2];
      req.category = params[3];
      req.event_name = params[4];
      req.skills_required = typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5];
      req.tech_stack = typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6];
      req.members_needed = params[7];
      req.open_roles = typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8];
      req.requirements = typeof params[9] === 'string' ? JSON.parse(params[9]) : params[9];
      req.deadline = params[10];
      req.deadline_display = params[11];
      req.status = req.current_team_size >= req.members_needed ? 'FULL' : 'OPEN';
      req.updated_at = new Date();
      return { rows: [req] };
    }
    return { rows: [] };
  }

  // 9c. DELETE FROM team_requests WHERE id = $1
  if (normalized.startsWith('delete from team_requests where id = $1')) {
    const id = params[0];
    const idx = memoryStore.team_requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      memoryStore.team_requests.splice(idx, 1);
      // Cascade delete members, applications, notifications
      memoryStore.team_members = memoryStore.team_members.filter(m => m.request_id !== id);
      memoryStore.applications = memoryStore.applications.filter(a => a.request_id !== id);
      memoryStore.notifications = memoryStore.notifications.filter(n => n.request_id !== id);
      return { rows: [{ id }] };
    }
    return { rows: [] };
  }

  // 9d. DELETE FROM applications WHERE id = $1
  if (normalized.startsWith('delete from applications where id = $1')) {
    const id = params[0];
    const idx = memoryStore.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      const removed = memoryStore.applications.splice(idx, 1)[0];
      memoryStore.notifications = memoryStore.notifications.filter(n => n.application_id !== id);
      return { rows: [removed] };
    }
    return { rows: [] };
  }

  // 10. INSERT INTO team_members
  if (normalized.startsWith('insert into team_members')) {
    const newMember = {
      id: memoryStore.team_members.length + 1,
      request_id: params[0],
      user_id: params[1],
      name: params[2],
      role: params[3],
      college: params[4],
      avatar: params[5],
      joined_at: new Date()
    };
    memoryStore.team_members.push(newMember);
    return { rows: [newMember] };
  }

  // 11. INSERT INTO applications
  if (normalized.startsWith('insert into applications')) {
    const hasApplicantId = params.length >= 12;
    const newApp = {
      id: params[0],
      request_id: params[1],
      applicant_id: hasApplicantId ? params[2] : null,
      applicant_name: hasApplicantId ? params[3] : params[2],
      applicant_email: hasApplicantId ? params[4] : params[3],
      applicant_college: hasApplicantId ? params[5] : params[4],
      applicant_avatar: hasApplicantId ? params[6] : params[5],
      role_applied: hasApplicantId ? params[7] : params[6],
      pitch: hasApplicantId ? params[8] : params[7],
      portfolio_link: hasApplicantId ? params[9] : params[8],
      hours_commitment: hasApplicantId ? params[10] : params[9],
      status: hasApplicantId ? params[11] : params[10],
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.applications.unshift(newApp);
    return { rows: [newApp] };
  }

  // 12. SELECT from applications by request_id
  if (normalized.includes('from applications where request_id = $1')) {
    const list = memoryStore.applications.filter(a => a.request_id === params[0]);
    return { rows: list };
  }

  // 12b. SELECT from applications by applicant_id (My Applications)
  if (normalized.includes('from applications') && normalized.includes('a.applicant_id = $1')) {
    const applicantId = params[0];
    const userApps = memoryStore.applications.filter(a => a.applicant_id === applicantId);
    const enriched = userApps.map(a => {
      const req = memoryStore.team_requests.find(r => r.id === a.request_id) || {};
      return {
        ...a,
        request_title: req.title || 'Team Project',
        event_name: req.event_name || 'Hackathon',
        category: req.category || 'Hackathons',
        members_needed: req.members_needed || 4,
        current_team_size: req.current_team_size || 1,
        creator_id: req.creator_id
      };
    });
    return { rows: enriched };
  }

  // 12c. Duplicate check: SELECT * FROM applications WHERE applicant_id = $1 AND request_id = $2
  if (normalized.includes('from applications where applicant_id = $1 and request_id = $2')) {
    const list = memoryStore.applications.filter(
      a => a.applicant_id === params[0] && a.request_id === params[1]
    );
    return { rows: list };
  }

  // 13. SELECT from applications by id
  if (normalized.includes('from applications where id = $1')) {
    const app = memoryStore.applications.find(a => a.id === params[0]);
    return { rows: app ? [app] : [] };
  }

  // 14. SELECT pending applications for team owner
  if (normalized.includes('from applications') && normalized.includes('r.creator_id = $1')) {
    const ownerId = params[0];
    const ownerRequests = memoryStore.team_requests.filter(r => r.creator_id === ownerId);
    const ownerReqIds = ownerRequests.map(r => r.id);

    const pendingApps = memoryStore.applications.filter(
      a => ownerReqIds.includes(a.request_id) && a.status === 'PENDING'
    );

    const enriched = pendingApps.map(a => {
      const req = ownerRequests.find(r => r.id === a.request_id) || {};
      return {
        ...a,
        request_title: req.title || 'Team Project',
        event_name: req.event_name || 'Hackathon',
        creator_id: req.creator_id
      };
    });

    return { rows: enriched };
  }

  // 15. UPDATE applications SET status = $1 WHERE id = $2
  if (normalized.includes('update applications set status = $1') && normalized.includes('where id = $2')) {
    const app = memoryStore.applications.find(a => a.id === params[1]);
    if (app) {
      app.status = params[0];
      app.updated_at = new Date();
      return { rows: [app] };
    }
    return { rows: [] };
  }

  // 16. UPDATE team_requests SET current_team_size
  if (normalized.includes('update team_requests set current_team_size')) {
    const req = memoryStore.team_requests.find(r => r.id === params[0]);
    if (req) {
      req.current_team_size = (req.current_team_size || 0) + 1;
      if (req.current_team_size >= req.members_needed) {
        req.status = 'FULL';
      }
      return { rows: [req] };
    }
    return { rows: [] };
  }

  // 16b. Duplicate notification check
  if (normalized.includes('from notifications where recipient_id = $1 and application_id = $2 and type = $3')) {
    const [recipId, appId, notifType] = params;
    const match = memoryStore.notifications.find(
      n => n.recipient_id === recipId && n.application_id === appId && n.type === notifType
    );
    return { rows: match ? [match] : [] };
  }

  // 17. INSERT INTO notifications
  if (normalized.startsWith('insert into notifications')) {
    const newNotif = {
      id: params[0],
      recipient_id: params[1],
      sender_id: params[2],
      request_id: params[3],
      application_id: params[4],
      type: params[5],
      title: params[6],
      message: params[7],
      is_read: false,
      created_at: new Date()
    };
    memoryStore.notifications.unshift(newNotif);
    return { rows: [newNotif] };
  }

  // 18. SELECT from notifications WHERE recipient_id = $1
  if (normalized.includes('from notifications') && normalized.includes('n.recipient_id = $1')) {
    const recipientId = params[0];
    const notifs = memoryStore.notifications.filter(n => n.recipient_id === recipientId);
    const enriched = notifs.map(n => {
      const sender = memoryStore.users.find(u => u.id === n.sender_id) || {};
      const req = memoryStore.team_requests.find(r => r.id === n.request_id) || {};
      const app = memoryStore.applications.find(a => a.id === n.application_id) || {};
      return {
        ...n,
        sender_name: sender.name || 'Student',
        sender_avatar: sender.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
        sender_college: sender.college || 'Campus Student',
        request_title: req.title || 'Team Project',
        request_event_name: req.event_name || 'Hackathon',
        application_status: app.status || 'PENDING',
        applicant_name: app.applicant_name || sender.name || 'Student',
        role_applied: app.role_applied || 'Teammate',
        application_pitch: app.pitch || ''
      };
    });
    return { rows: enriched };
  }

  // 19. UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2
  if (normalized.includes('update notifications set is_read = true where id = $1 and recipient_id = $2')) {
    const notif = memoryStore.notifications.find(n => n.id === params[0] && n.recipient_id === params[1]);
    if (notif) {
      notif.is_read = true;
      return { rows: [notif] };
    }
    return { rows: [] };
  }

  // 20. UPDATE notifications SET is_read = true WHERE recipient_id = $1
  if (normalized.includes('update notifications set is_read = true where recipient_id = $1')) {
    const recipientId = params[0];
    const userNotifs = memoryStore.notifications.filter(n => n.recipient_id === recipientId);
    userNotifs.forEach(n => { n.is_read = true; });
    return { rows: userNotifs };
  }

  // Fallback
  return { rows: [] };
}

async function query(text, params) {
  if (usePostgres) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      // If table doesn't exist or connection dropped, fallback
      console.warn('PostgreSQL query error, falling back to in-memory store:', err.message);
      return handleMemoryQuery(text, params);
    }
  }

  return handleMemoryQuery(text, params);
}

module.exports = {
  pool,
  query
};
