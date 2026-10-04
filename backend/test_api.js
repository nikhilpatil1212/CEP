// Automated test suite for CampusConnect backend & authentication system
const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateCreateRequest, validateCreateApplication } = require('./middleware/validate');
const { notFoundHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const UserModel = require('./models/userModel');

console.log('🧪 Running CampusConnect Backend & Authentication Test Suite...\n');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Validation Middleware Tests
it('validateCreateRequest rejects empty title', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { body: { title: '', shortDesc: 'Valid desc' } };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next() should not be called'); };

  validateCreateRequest(req, res, next);
  assert.strictEqual(statusSent, 400);
  assert.ok(jsonSent.error.includes('title is required'));
});

it('validateCreateRequest rejects empty shortDesc', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { body: { title: 'Hackathon Project', shortDesc: '   ' } };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next() should not be called'); };

  validateCreateRequest(req, res, next);
  assert.strictEqual(statusSent, 400);
  assert.ok(jsonSent.error.includes('Short description is required'));
});

it('validateCreateRequest accepts valid body', () => {
  let nextCalled = false;
  const req = { body: { title: 'AI Advisory', shortDesc: 'Elevator pitch here' } };
  const res = {};
  const next = () => { nextCalled = true; };

  validateCreateRequest(req, res, next);
  assert.strictEqual(nextCalled, true);
});

it('validateCreateApplication rejects missing roleApplied', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { body: { roleApplied: '', pitch: 'I want to help' } };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next() should not be called'); };

  validateCreateApplication(req, res, next);
  assert.strictEqual(statusSent, 400);
  assert.ok(jsonSent.error.includes('Role applied for is required'));
});

it('validateCreateApplication rejects missing pitch', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { body: { roleApplied: 'Frontend Dev', pitch: '' } };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next() should not be called'); };

  validateCreateApplication(req, res, next);
  assert.strictEqual(statusSent, 400);
  assert.ok(jsonSent.error.includes('Application pitch is required'));
});

it('validateCreateApplication accepts valid application', () => {
  let nextCalled = false;
  const req = { body: { roleApplied: 'Frontend Dev', pitch: 'Excited about the project!' } };
  const res = {};
  const next = () => { nextCalled = true; };

  validateCreateApplication(req, res, next);
  assert.strictEqual(nextCalled, true);
});

it('notFoundHandler returns 404 with method and path', () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { method: 'GET', originalUrl: '/api/invalid-route' };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };

  notFoundHandler(req, res);
  assert.strictEqual(statusSent, 404);
  assert.ok(jsonSent.error.includes('Route not found'));
});

// 2. Cryptographic & JWT Unit Tests
itAsync('bcrypt correctly hashes and verifies password', async () => {
  const password = 'StrongPassword123!';
  const hash = await bcrypt.hash(password, 10);
  assert.notStrictEqual(password, hash);
  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true);
  const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
  assert.strictEqual(isWrongMatch, false);
});

it('JWT signs and verifies payload with secret', () => {
  const secret = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_dev';
  const token = jwt.sign({ id: 'user-123', email: 'test@pict.edu' }, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, 'user-123');
  assert.strictEqual(decoded.email, 'test@pict.edu');
});

it('JWT rejects invalid token signature', () => {
  const validToken = jwt.sign({ id: 'user-123' }, 'secret-a');
  assert.throws(() => {
    jwt.verify(validToken, 'secret-b');
  });
});

// 3. AuthenticateToken Middleware Unit Tests
itAsync('authenticateToken rejects request without authorization header with 401', async () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { headers: {} };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next should not be called'); };

  await authenticateToken(req, res, next);
  assert.strictEqual(statusSent, 401);
  assert.ok(jsonSent.error.includes('token required'));
});

itAsync('authenticateToken rejects invalid token with 403', async () => {
  let statusSent = null;
  let jsonSent = null;
  const req = { headers: { authorization: 'Bearer invalid.token.value' } };
  const res = {
    status(s) { statusSent = s; return this; },
    json(j) { jsonSent = j; }
  };
  const next = () => { throw new Error('next should not be called'); };

  await authenticateToken(req, res, next);
  assert.strictEqual(statusSent, 403);
  assert.ok(jsonSent.error.includes('Invalid authentication token'));
});

itAsync('authenticateToken accepts valid token and attaches user to req', async () => {
  const secret = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_dev';
  const token = jwt.sign({ id: 'user-onkar', email: 'onkar@test.edu' }, secret);

  // Mock UserModel.findById
  const originalFindById = UserModel.findById;
  UserModel.findById = async (id) => ({
    id,
    name: 'Onkar Patil',
    email: 'onkar@test.edu',
    college: 'PICT Pune'
  });

  let nextCalled = false;
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {};
  const next = () => { nextCalled = true; };

  try {
    await authenticateToken(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.name, 'Onkar Patil');
  } finally {
    UserModel.findById = originalFindById;
  }
});

// 4. HTTP Integration Tests on Live Express Server
async function runHttpTests() {
  const app = require('./server');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');
    console.log('  ✅ HTTP GET /api/health -> 200 OK');
    passed++;

    // 404 check
    const notFoundRes = await fetch(`${baseUrl}/api/nonexistent`);
    assert.strictEqual(notFoundRes.status, 404);
    console.log('  ✅ HTTP GET /api/nonexistent -> 404 Not Found');
    passed++;

    // Unauthenticated GET /api/auth/me -> 401
    const unauthMeRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(unauthMeRes.status, 401);
    const unauthMeJson = await unauthMeRes.json();
    assert.ok(unauthMeJson.error.includes('token required'));
    console.log('  ✅ HTTP GET /api/auth/me (no token) -> 401 Unauthorized');
    passed++;

    // Invalid token GET /api/auth/me -> 403
    const invalidMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': 'Bearer bad.token.here' }
    });
    assert.strictEqual(invalidMeRes.status, 403);
    console.log('  ✅ HTTP GET /api/auth/me (invalid token) -> 403 Forbidden');
    passed++;

    // Protected POST /api/requests without token -> 401
    const unauthCreateRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', shortDesc: 'Desc' })
    });
    assert.strictEqual(unauthCreateRes.status, 401);
    console.log('  ✅ HTTP POST /api/requests (no token) -> 401 Unauthorized');
    passed++;

    // Protected POST /api/requests/:id/applications without token -> 401
    const unauthAppRes = await fetch(`${baseUrl}/api/requests/req-1/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleApplied: 'Dev', pitch: 'Hi' })
    });
    assert.strictEqual(unauthAppRes.status, 401);
    console.log('  ✅ HTTP POST /api/requests/req-1/applications (no token) -> 401 Unauthorized');
    passed++;

    // Registration validation: Mismatched passwords -> 400
    const mismatchRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student',
        email: 'student@pict.edu',
        password: 'Password123',
        confirmPassword: 'MismatchPassword'
      })
    });
    assert.strictEqual(mismatchRegRes.status, 400);
    const mismatchRegJson = await mismatchRegRes.json();
    assert.ok(mismatchRegJson.error.includes('do not match'));
    console.log('  ✅ HTTP POST /api/auth/register (mismatched password) -> 400 Bad Request');
    passed++;

    // Registration validation: Invalid email format -> 400
    const badEmailRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student',
        email: 'invalid-email-format',
        password: 'Password123',
        confirmPassword: 'Password123'
      })
    });
    assert.strictEqual(badEmailRegRes.status, 400);
    console.log('  ✅ HTTP POST /api/auth/register (invalid email format) -> 400 Bad Request');
    passed++;

    // Registration validation: Short password (<6 chars) -> 400
    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student',
        email: 'student@pict.edu',
        password: '123',
        confirmPassword: '123'
      })
    });
    assert.strictEqual(shortPassRes.status, 400);
    console.log('  ✅ HTTP POST /api/auth/register (short password) -> 400 Bad Request');
    passed++;

    // Login validation: Missing fields -> 400
    const emptyLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(emptyLoginRes.status, 400);
    console.log('  ✅ HTTP POST /api/auth/login (missing credentials) -> 400 Bad Request');
    passed++;

    // Reset Password: Missing email -> 400
    const emptyResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', newPassword: 'NewPassword123!', confirmNewPassword: 'NewPassword123!' })
    });
    assert.strictEqual(emptyResetRes.status, 400);
    console.log('  ✅ HTTP POST /api/auth/reset-password (missing email) -> 400 Bad Request');
    passed++;

    // Reset Password: Mismatched passwords -> 400
    const mismatchResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'onkar.patil@pict.edu', newPassword: 'NewPassword123!', confirmNewPassword: 'Wrong' })
    });
    assert.strictEqual(mismatchResetRes.status, 400);
    console.log('  ✅ HTTP POST /api/auth/reset-password (mismatch) -> 400 Bad Request');
    passed++;

    // Reset Password: Nonexistent email -> 404
    const notFoundResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@pict.edu', newPassword: 'NewPassword123!', confirmNewPassword: 'NewPassword123!' })
    });
    assert.strictEqual(notFoundResetRes.status, 404);
    console.log('  ✅ HTTP POST /api/auth/reset-password (nonexistent user) -> 404 Not Found');
    passed++;

    // Reset Password: Valid request -> 200
    const validResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'onkar.patil@pict.edu', newPassword: 'NewSecret123!', confirmNewPassword: 'NewSecret123!' })
    });
    assert.strictEqual(validResetRes.status, 200);
    const validResetJson = await validResetRes.json();
    assert.ok(validResetJson.message.includes('successfully'));
    console.log('  ✅ HTTP POST /api/auth/reset-password (valid) -> 200 OK');
    passed++;

    // Verify login with new password -> 200
    const newPassLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'onkar.patil@pict.edu', password: 'NewSecret123!' })
    });
    assert.strictEqual(newPassLoginRes.status, 200);
    console.log('  ✅ HTTP POST /api/auth/login with new reset password -> 200 OK');
    passed++;

    // Verify login with old password now fails -> 401
    const oldPassLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'onkar.patil@pict.edu', password: 'Password123!' })
    });
    assert.strictEqual(oldPassLoginRes.status, 401);
    console.log('  ✅ HTTP POST /api/auth/login with old password rejected -> 401 Unauthorized');
    passed++;

    // --- OWNER NOTIFICATION & APPLICATION ACCEPTANCE / ROSTER TESTS ---
    // 1. Get auth token for team owner (onkar)
    const onkarLoginData = await newPassLoginRes.json();
    const onkarToken = onkarLoginData.token;

    // 2. Fetch owner notifications -> 200 (initially clean slate with no old applications)
    const ownerNotifRes = await fetch(`${baseUrl}/api/applications/notifications`, {
      headers: { 'Authorization': `Bearer ${onkarToken}` }
    });
    assert.strictEqual(ownerNotifRes.status, 200);
    const notifJson = await ownerNotifRes.json();
    assert.ok(typeof notifJson.count === 'number');
    assert.ok(Array.isArray(notifJson.applications));
    console.log('  ✅ HTTP GET /api/applications/notifications -> 200 OK (Clean Slate, No Old Seed Applications)');
    passed++;

    // 3. Register a new student applicant (Pooja)
    const poojaEmail = `pooja_${Date.now()}@pict.edu`;
    const poojaRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Sharma',
        email: poojaEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'PICT Pune',
        role: 'Frontend Enthusiast'
      })
    });
    assert.strictEqual(poojaRegRes.status, 201);
    const poojaData = await poojaRegRes.json();
    const poojaToken = poojaData.token;
    // 3b. Seed req-1 dynamically specifically for test suite so production starts with 0 lingering teams
    const { query } = require('./config/db');
    await query(
      `INSERT INTO team_requests (
        id, creator_id, title, category, event_name, short_desc, full_desc,
        skills_required, tech_stack, members_needed, current_team_size,
        open_roles, experience_level, deadline, deadline_display, days_left,
        is_urgent, is_featured, requirements, status, owner_included
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        'req-1', 'user-onkar', 'KisanSetu AI - Smart Agri Advisory & Crop Health',
        'Hackathons', 'Smart India Hackathon (SIH 2026)',
        'Building an offline-first multilingual crop disease identifier and real-time mandi price predictor for farmers.',
        'We are preparing for Smart India Hackathon (SIH 2026) under the Agriculture & Rural Development theme.',
        JSON.stringify(['React', 'FastAPI', 'Tailwind CSS', 'Python']),
        JSON.stringify(['React 19', 'FastAPI', 'PyTorch', 'PostgreSQL', 'Tailwind']),
        4, 3,
        JSON.stringify(['Frontend Developer (React & Tailwind) - 1 Spot Left']),
        'Intermediate', '2026-11-15', 'Nov 15, 2026', 8, true, true,
        JSON.stringify(['Good familiarity with React components']), 'OPEN', true
      ]
    );
    await query(
      `INSERT INTO team_members (request_id, user_id, name, role, college, avatar) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['req-1', 'user-onkar', 'Onkar Patil', 'Team Lead', 'PICT Pune', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80']
    );
    await query(
      `INSERT INTO team_members (request_id, user_id, name, role, college, avatar) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['req-1', null, 'Priya Deshmukh', 'UI/UX & Design', 'PICT Pune', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80']
    );
    await query(
      `INSERT INTO team_members (request_id, user_id, name, role, college, avatar) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['req-1', null, 'Rohan Kulkarni', 'Backend & Cloud', 'PICT Pune', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80']
    );

    // 4. Pooja applies to req-1 using her authenticated profile
    const poojaApplyRes = await fetch(`${baseUrl}/api/requests/req-1/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${poojaToken}`
      },
      body: JSON.stringify({
        roleApplied: 'Frontend Developer (React & Tailwind) - 1 Spot Left',
        pitch: 'I love React and want to contribute to KisanSetu UI!',
        portfolioLink: 'https://github.com/pooja-dev',
        hoursCommitment: '10-15 hrs/week'
      })
    });
    assert.strictEqual(poojaApplyRes.status, 201);
    const poojaApplyJson = await poojaApplyRes.json();
    assert.strictEqual(poojaApplyJson.application.applicant_name, 'Pooja Sharma');
    assert.strictEqual(poojaApplyJson.application.applicant_id, poojaData.user.id);
    console.log('  ✅ HTTP POST /api/requests/:id/applications applies with logged-in user profile');
    passed++;

    // 5. Creator cannot apply to their own team -> 400
    const selfApplyRes = await fetch(`${baseUrl}/api/requests/req-1/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${onkarToken}`
      },
      body: JSON.stringify({
        roleApplied: 'Team Lead',
        pitch: 'Applying to my own team'
      })
    });
    assert.strictEqual(selfApplyRes.status, 400);
    console.log('  ✅ HTTP POST /api/requests/:id/applications blocks self-application');
    passed++;

    // 6. Non-owner cannot accept applications -> 403
    const unauthorizedAcceptRes = await fetch(`${baseUrl}/api/applications/${poojaApplyJson.application.id}/accept`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${poojaToken}`
      }
    });
    assert.strictEqual(unauthorizedAcceptRes.status, 403);
    console.log('  ✅ HTTP PATCH /api/applications/:id/accept rejects non-owners with 403');
    passed++;

    // 7. Owner accepts Pooja's application -> member added to team roster & seats updated
    const acceptRes = await fetch(`${baseUrl}/api/applications/${poojaApplyJson.application.id}/accept`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${onkarToken}`
      }
    });
    assert.strictEqual(acceptRes.status, 200);
    const acceptJson = await acceptRes.json();
    assert.strictEqual(acceptJson.application.status, 'APPROVED');
    assert.strictEqual(acceptJson.updatedRequest.currentTeamSize, 4);
    assert.strictEqual(acceptJson.updatedRequest.status, 'FULL');
    const hasPoojaInRoster = acceptJson.updatedRequest.currentMembers.some(m => m.name === 'Pooja Sharma');
    assert.ok(hasPoojaInRoster);
    console.log('  ✅ HTTP PATCH /api/applications/:id/accept updates roster, team size & remaining seats with APPROVED');
    passed++;

    // ==============================================================
    // 9. COMPREHENSIVE 3-ACCOUNT SEPARATION & NOTIFICATION BUG AUDIT
    // ==============================================================
    console.log('\n--- 3-Account Separation & Notification Recipient Audit ---');

    // Register User A (Team Owner)
    const userAEmail = `studentA_${Date.now()}@pict.edu`;
    const regARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student A',
        email: userAEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'PICT Pune'
      })
    });
    assert.strictEqual(regARes.status, 201);
    const userAData = await regARes.json();
    const tokenA = userAData.token;
    const userAId = userAData.user.id;

    // Register User B (Applicant 1)
    const userBEmail = `studentB_${Date.now()}@pict.edu`;
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student B',
        email: userBEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'PICT Pune'
      })
    });
    assert.strictEqual(regBRes.status, 201);
    const userBData = await regBRes.json();
    const tokenB = userBData.token;
    const userBId = userBData.user.id;

    // Register User C (Applicant 2)
    const userCEmail = `studentC_${Date.now()}@pict.edu`;
    const regCRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student C',
        email: userCEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        college: 'PICT Pune'
      })
    });
    assert.strictEqual(regCRes.status, 201);
    const userCData = await regCRes.json();
    const tokenC = userCData.token;
    const userCId = userCData.user.id;

    // Step 1: User A creates Team Alpha (ownerIncluded = true, membersNeeded = 4)
    const createAlphaRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Team Alpha SIH',
        category: 'Hackathons',
        eventName: 'Smart India Hackathon 2026',
        shortDesc: 'AI for Healthcare Team',
        membersNeeded: 4,
        ownerIncluded: true
      })
    });
    assert.strictEqual(createAlphaRes.status, 201);
    const alphaTeam = await createAlphaRes.json();
    assert.strictEqual(alphaTeam.creatorId, userAId);
    assert.strictEqual(alphaTeam.ownerIncluded, true);
    assert.strictEqual(alphaTeam.currentTeamSize, 1);
    assert.strictEqual(alphaTeam.remainingSeats, 3);
    console.log('  ✅ Step 1: User A creates Team Alpha (ownerIncluded=true, remainingSeats=3)');
    passed++;

    // Step 2: User A verifies My Teams contains Team Alpha
    const myTeamsARes = await fetch(`${baseUrl}/api/requests/my-teams`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(myTeamsARes.status, 200);
    const myTeamsA = await myTeamsARes.json();
    assert.ok(myTeamsA.some(t => t.id === alphaTeam.id));

    // User B verifies My Teams does NOT contain Team Alpha
    const myTeamsBRes = await fetch(`${baseUrl}/api/requests/my-teams`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(myTeamsBRes.status, 200);
    const myTeamsB = await myTeamsBRes.json();
    assert.strictEqual(myTeamsB.some(t => t.id === alphaTeam.id), false);
    console.log('  ✅ Step 2: GET /api/requests/my-teams returns ONLY authenticated user\'s teams');
    passed++;

    // Step 3: User B applies to Team Alpha
    const applyBRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        roleApplied: 'ML Engineer',
        pitch: 'Experienced in Python & PyTorch',
        portfolioLink: 'https://github.com/student-b'
      })
    });
    assert.strictEqual(applyBRes.status, 201);
    const appBData = await applyBRes.json();
    const appBId = appBData.application.id;
    assert.strictEqual(appBData.application.applicant_id, userBId);
    assert.strictEqual(appBData.application.status, 'PENDING');
    console.log('  ✅ Step 3: User B applies to Team Alpha (applicantId = User B, status = PENDING)');
    passed++;

    // Step 4: Verify User B sees application under My Applications
    const myAppsBRes = await fetch(`${baseUrl}/api/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(myAppsBRes.status, 200);
    const myAppsB = await myAppsBRes.json();
    assert.ok(myAppsB.some(a => a.id === appBId && a.status === 'PENDING'));
    console.log('  ✅ Step 4: User B sees application in GET /api/applications/my-applications');
    passed++;

    // Step 5: CRITICAL BUG FIX CHECK:
    // User A receives notification: "Student B applied to join Team Alpha"
    const notifsARes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(notifsARes.status, 200);
    const notifsA = await notifsARes.json();
    const userANotif = notifsA.notifications.find(n => n.application_id === appBId);
    assert.ok(userANotif, 'User A (Owner) MUST receive the application notification');
    assert.strictEqual(userANotif.recipient_id, userAId);
    assert.strictEqual(userANotif.type, 'NEW_APPLICATION');

    // User B must NOT receive this owner notification!
    const notifsBRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(notifsBRes.status, 200);
    const notifsB = await notifsBRes.json();
    const userBReceivedOwnApp = notifsB.notifications.find(n => n.application_id === appBId && n.type === 'NEW_APPLICATION');
    assert.strictEqual(userBReceivedOwnApp, undefined, 'User B (Applicant) MUST NOT receive the owner notification!');
    console.log('  ✅ Step 5: CRITICAL BUG FIXED: Notification went to Owner User A, NOT Applicant User B');
    passed++;

    // Step 6: User A views incoming applications for Team Alpha
    const incomingAlphaRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}/applications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(incomingAlphaRes.status, 200);
    const incomingAlpha = await incomingAlphaRes.json();
    assert.ok(incomingAlpha.some(a => a.id === appBId));

    // User C CANNOT access User A's incoming application list -> 403 Forbidden
    const unauthIncomingRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}/applications`, {
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    assert.strictEqual(unauthIncomingRes.status, 403);
    console.log('  ✅ Step 6: GET /api/requests/:id/applications strictly protected: Non-owner gets 403');
    passed++;

    // Step 7: User A approves User B
    const approveBRes = await fetch(`${baseUrl}/api/applications/${appBId}/accept`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(approveBRes.status, 200);
    const approveBJson = await approveBRes.json();
    assert.strictEqual(approveBJson.application.status, 'APPROVED');
    assert.strictEqual(approveBJson.updatedRequest.currentTeamSize, 2);
    assert.strictEqual(approveBJson.updatedRequest.remainingSeats, 2);
    console.log('  ✅ Step 7: User A approves User B -> status APPROVED, remainingSeats = 2');
    passed++;

    // Step 8: User B receives approval notification
    const notifsBAfterApproveRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const notifsBAfterApprove = await notifsBAfterApproveRes.json();
    const approveNotif = notifsBAfterApprove.notifications.find(n => n.type === 'APPLICATION_APPROVED');
    assert.ok(approveNotif, 'User B must receive APPLICATION_APPROVED notification');
    assert.strictEqual(approveNotif.recipient_id, userBId);
    console.log('  ✅ Step 8: User B receives approval notification');
    passed++;

    // Step 9: User C applies to Team Alpha
    const applyCRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenC}`
      },
      body: JSON.stringify({
        roleApplied: 'Backend Developer',
        pitch: 'Node.js & PostgreSQL expertise'
      })
    });
    assert.strictEqual(applyCRes.status, 201);
    const appCData = await applyCRes.json();
    const appCId = appCData.application.id;

    // Verify User A receives User C's application notification
    const notifsAAfterCRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const notifsAAfterC = await notifsAAfterCRes.json();
    assert.ok(notifsAAfterC.notifications.some(n => n.application_id === appCId && n.type === 'NEW_APPLICATION'));

    // Verify User C sees only their own application under My Applications
    const myAppsCRes = await fetch(`${baseUrl}/api/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    const myAppsC = await myAppsCRes.json();
    assert.ok(myAppsC.some(a => a.id === appCId));
    assert.strictEqual(myAppsC.some(a => a.id === appBId), false, 'User C cannot see User B\'s private application');
    console.log('  ✅ Step 9: User C applies; User A notified; User C sees only own application');
    passed++;

    // Step 10: Authorization checks across non-owners
    // User B cannot modify User A's team
    const modRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert.strictEqual(modRes.status, 403);

    // User B cannot delete User A's team
    const delRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(delRes.status, 403);

    // User B cannot approve User C's application
    const badApproveRes = await fetch(`${baseUrl}/api/applications/${appCId}/accept`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(badApproveRes.status, 403);

    // User A cannot withdraw User B's application using applicant withdrawal endpoint
    const badWithdrawRes = await fetch(`${baseUrl}/api/applications/${appBId}/withdraw`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(badWithdrawRes.status, 403);

    // User B cannot withdraw User C's application
    const badWithdrawCRes = await fetch(`${baseUrl}/api/applications/${appCId}/withdraw`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(badWithdrawCRes.status, 403);
    console.log('  ✅ Step 10: All sensitive endpoints enforce strict authorization (403 for unauthorized users)');
    passed++;

    // Step 11: User C withdraws their own application
    const withdrawCRes = await fetch(`${baseUrl}/api/applications/${appCId}/withdraw`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    assert.strictEqual(withdrawCRes.status, 200);
    const withdrawCJson = await withdrawCRes.json();
    assert.strictEqual(withdrawCJson.application.status, 'WITHDRAWN');

    // Withdrawal does not affect team size
    const checkTeamAlphaRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`);
    const checkTeamAlpha = await checkTeamAlphaRes.json();
    assert.strictEqual(checkTeamAlpha.currentTeamSize, 2);
    assert.strictEqual(checkTeamAlpha.remainingSeats, 2);
    console.log('  ✅ Step 11: Applicant withdraws application -> status WITHDRAWN; seats unaffected');
    passed++;

    // ==============================================================
    // 12. MULTIPLE APPLICATIONS PER STUDENT TEST (Requirement 30)
    // ==============================================================
    console.log('\n--- Multiple Applications Per Student Test ---');
    // User A creates Team Beta and Team Gamma
    const createBetaRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Team Beta Web3',
        shortDesc: 'Blockchain voting',
        membersNeeded: 4,
        ownerIncluded: true
      })
    });
    const betaTeam = await createBetaRes.json();

    const createGammaRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'Team Gamma Robotics',
        shortDesc: 'Autonomous drone fleet',
        membersNeeded: 4,
        ownerIncluded: false
      })
    });
    const gammaTeam = await createGammaRes.json();
    assert.strictEqual(gammaTeam.ownerIncluded, false);
    assert.strictEqual(gammaTeam.currentTeamSize, 0);
    assert.strictEqual(gammaTeam.remainingSeats, 4);

    // User B applies to Team Beta
    const applyBetaRes = await fetch(`${baseUrl}/api/requests/${betaTeam.id}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ roleApplied: 'Solidity Dev', pitch: 'Smart contracts' })
    });
    assert.strictEqual(applyBetaRes.status, 201);
    const betaAppJson = await applyBetaRes.json();

    // User B applies to Team Gamma
    const applyGammaRes = await fetch(`${baseUrl}/api/requests/${gammaTeam.id}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ roleApplied: 'Embedded Dev', pitch: 'ROS2 & C++' })
    });
    assert.strictEqual(applyGammaRes.status, 201);
    const gammaAppJson = await applyGammaRes.json();

    // User A denies User B's application to Team Gamma
    const denyGammaRes = await fetch(`${baseUrl}/api/applications/${gammaAppJson.application.id}/reject`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(denyGammaRes.status, 200);
    const denyGammaJson = await denyGammaRes.json();
    assert.strictEqual(denyGammaJson.application.status, 'DENIED');

    // Verify User B's My Applications contains:
    // Team Alpha -> APPROVED
    // Team Beta -> PENDING
    // Team Gamma -> DENIED
    const allAppsBRes = await fetch(`${baseUrl}/api/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(allAppsBRes.status, 200);
    const allAppsB = await allAppsBRes.json();

    const appAlpha = allAppsB.find(a => a.request_id === alphaTeam.id);
    const appBeta = allAppsB.find(a => a.request_id === betaTeam.id);
    const appGamma = allAppsB.find(a => a.request_id === gammaTeam.id);

    assert.ok(appAlpha && appAlpha.status === 'APPROVED');
    assert.ok(appBeta && appBeta.status === 'PENDING');
    assert.ok(appGamma && appGamma.status === 'DENIED');
    console.log('  ✅ Step 12: User B has multiple applications with distinct statuses (APPROVED, PENDING, DENIED)');
    passed++;

    // Step 13: Team Capacity Validation (cannot reduce capacity below occupied seats)
    const invalidReduceRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ membersNeeded: 1 })
    });
    assert.strictEqual(invalidReduceRes.status, 400);
    console.log('  ✅ Step 13: Cannot reduce team capacity below occupied seats (returns 400)');
    passed++;

    // Step 14: Delete / Remove old team application
    // User C (unauthorized) attempts to delete User B's application -> 403
    const unauthDeleteAppRes = await fetch(`${baseUrl}/api/applications/${gammaAppJson.application.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenC}` }
    });
    assert.strictEqual(unauthDeleteAppRes.status, 403);

    // User B (applicant) deletes their denied application to Team Gamma -> 200
    const deleteAppRes = await fetch(`${baseUrl}/api/applications/${gammaAppJson.application.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(deleteAppRes.status, 200);

    // Verify it is removed from User B's applications
    const appsAfterDeleteRes = await fetch(`${baseUrl}/api/applications/my-applications`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const appsAfterDelete = await appsAfterDeleteRes.json();
    assert.strictEqual(appsAfterDelete.some(a => a.id === gammaAppJson.application.id), false);
    console.log('  ✅ Step 14: DELETE /api/applications/:id removes old team application');
    passed++;

    // Step 15: Delete Team Post functionality & authorization
    // 15a: Non-owner User B attempts to delete User A's Team Alpha -> 403 Forbidden
    const unauthDeleteTeamRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(unauthDeleteTeamRes.status, 403);

    // 15b: Owner User A deletes Team Alpha -> 200 OK
    const ownerDeleteTeamRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(ownerDeleteTeamRes.status, 200);

    // 15c: Verify Team Alpha is gone from all requests
    const getDeletedTeamRes = await fetch(`${baseUrl}/api/requests/${alphaTeam.id}`);
    assert.strictEqual(getDeletedTeamRes.status, 404);

    // 15d: Any authenticated user can delete seed demo post req-1 -> 200 OK
    const deleteSeedPostRes = await fetch(`${baseUrl}/api/requests/req-1`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert.strictEqual(deleteSeedPostRes.status, 200);
    console.log('  ✅ Step 15: DELETE /api/requests/:id allows owner and demo cleanup; blocks unauthorized users');
    passed++;

  } catch (err) {
    console.error('  ❌ HTTP integration test failed:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runHttpTests();

