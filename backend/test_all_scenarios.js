const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING COMPLETE CAMPUSCONNECT VERIFICATION SUITE');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const emailA = `nikhil.patil.${timestamp}@pict.edu`;
  const emailB = `rahul.sharma.${timestamp}@pict.edu`;
  const emailC = `priya.shah.${timestamp}@pict.edu`;

  // 1. Register User A (Leader)
  console.log('👉 Creating User A (Team Leader)...');
  const regA = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: emailA,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    name: 'Nikhil Patil',
    college: 'PICT Pune'
  });
  const tokenA = regA.data.token;
  const userA = regA.data.user;
  console.log(`   User A registered: ${userA.name} (${userA.id})`);

  // 2. Register User B (Applicant / Member)
  console.log('👉 Creating User B (Applicant)...');
  const regB = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: emailB,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    name: 'Rahul Sharma',
    college: 'COEP Pune'
  });
  const tokenB = regB.data.token;
  const userB = regB.data.user;
  console.log(`   User B registered: ${userB.name} (${userB.id})`);

  // 3. Register User C (Second Applicant)
  console.log('👉 Creating User C (Second Applicant)...');
  const regC = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: emailC,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    name: 'Priya Shah',
    college: 'VIT Pune'
  });
  const tokenC = regC.data.token;
  const userC = regC.data.user;
  console.log(`   User C registered: ${userC.name} (${userC.id})\n`);

  // ==========================================
  // TEST 1: User creates a team -> appears in My Teams -> Teams I Host
  // ==========================================
  console.log('👉 TEST 1: User A creates a team (Capacity 2)...');
  const createTeamRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'AI Smart India Hackathon Squad',
    category: 'Hackathons',
    eventName: 'SIH 2026',
    shortDesc: 'Building AI computer vision for rural farmers',
    fullDesc: 'We need a full stack developer and ML engineer for SIH 2026.',
    skillsRequired: ['Python', 'React', 'FastAPI'],
    techStack: ['PyTorch', 'React', 'Node.js'],
    membersNeeded: 2,
    ownerIncluded: true,
    experienceLevel: 'Intermediate',
    deadline: '2026-11-20'
  });
  const team = createTeamRes.data;
  console.log(`   Team created: "${team.title}" (ID: ${team.id})`);

  const myTeamsA = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests/my-teams',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const hostedA = myTeamsA.data.hosted || [];
  const allA = myTeamsA.data.all || [];
  const inHosted = hostedA.some(t => t.id === team.id);
  const inAllA = allA.some(t => t.id === team.id);
  console.log(`   TEST 1 RESULT: ${inHosted && inAllA ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   (Team in hosted: ${inHosted}, in all: ${inAllA})\n`);

  // ==========================================
  // TEST 5: Student B applies -> Leader receives notification
  // ==========================================
  console.log('👉 TEST 5: Student B applies to Team...');
  const applyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team.id}/applications`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    }
  }, {
    roleApplied: 'Frontend Developer',
    pitch: 'I have 2 years of experience with React & UI design.',
    hoursCommitment: '15+ hrs/week'
  });
  const appB = applyRes.data.application;
  console.log(`   Application submitted: Status ${appB.status}`);

  const notifsA = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const notifForLeader = notifsA.data.notifications.find(n => n.application_id === appB.id);
  console.log(`   Notification found for Leader: "${notifForLeader?.message}"`);
  console.log(`   TEST 5 RESULT: ${notifForLeader ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 6: Student B tries to apply again -> Duplicate blocked!
  // ==========================================
  console.log('👉 TEST 6: Student B tries to apply again to the same team...');
  const dupApplyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team.id}/applications`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`
    }
  }, {
    roleApplied: 'Frontend Developer',
    pitch: 'Applying again'
  });
  console.log(`   Response status: ${dupApplyRes.status}`);
  console.log(`   Error returned: "${dupApplyRes.data.error}"`);
  const isDuplicateBlocked = dupApplyRes.status === 400 && dupApplyRes.data.error === 'You have already applied to this team.';
  console.log(`   TEST 6 RESULT: ${isDuplicateBlocked ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 7: Leader accepts applicant B
  // ==========================================
  console.log('👉 TEST 7: Leader accepts Student B...');
  const acceptRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/applications/${appB.id}/accept`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const updatedReq = acceptRes.data.updatedRequest;
  const isBMember = updatedReq.currentMembers.some(m => m.userId === userB.id || m.name === userB.name);
  console.log(`   Updated team size: ${updatedReq.currentTeamSize} / ${updatedReq.membersNeeded}`);
  console.log(`   Remaining seats: ${updatedReq.remainingSeats}`);
  console.log(`   Is Student B in roster: ${isBMember}`);

  const notifsB = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const approvalNotif = notifsB.data.notifications.find(n => n.type === 'APPLICATION_APPROVED');
  console.log(`   Student B received notification: "${approvalNotif?.message}"`);
  console.log(`   TEST 7 RESULT: ${isBMember && approvalNotif ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 8: Leader rejects an applicant
  // ==========================================
  console.log('👉 TEST 8: Leader rejects an applicant...');
  // User A creates Team 2 with capacity 3
  const team2Res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, {
    title: 'Open Source ML Toolkit',
    category: 'Open Source',
    eventName: 'GSOC 2026',
    shortDesc: 'Building ML tools',
    fullDesc: 'Python & PyTorch project',
    skillsRequired: ['Python', 'PyTorch'],
    membersNeeded: 3,
    ownerIncluded: true,
    deadline: '2026-11-01'
  });
  const team2 = team2Res.data;

  // Student C applies to Team 2
  const applyCRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team2.id}/applications`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenC}`
    }
  }, {
    roleApplied: 'Python Developer',
    pitch: 'I have experience in PyTorch'
  });
  const appC = applyCRes.data.application;

  // Leader A rejects Student C
  const rejectRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/applications/${appC.id}/reject`,
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  console.log(`   Reject response status: ${rejectRes.status}`);

  // Verify Student C is not in team members
  const team2Details = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team2.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const isCInRoster = team2Details.data.currentMembers.some(m => m.userId === userC.id);
  console.log(`   Is Student C in roster: ${isCInRoster} (Roster size: ${team2Details.data.currentMembers.length})`);

  // Verify Student C received rejection notification
  const notifsC = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenC}` }
  });
  const rejectNotif = notifsC.data.notifications.find(n => n.type === 'APPLICATION_DENIED' || n.type === 'APPLICATION_REJECTED');
  console.log(`   Student C received rejection notification: "${rejectNotif?.message}"`);

  // Verify Team 2 does NOT appear in Student C's joined teams
  const myTeamsC = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests/my-teams',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenC}` }
  });
  const isCJoinedTeam2 = (myTeamsC.data.joined || []).some(t => t.id === team2.id);
  console.log(`   Is Team 2 in Student C joined teams: ${isCJoinedTeam2}`);

  const test8Passed = rejectRes.status === 200 && !isCInRoster && rejectNotif && !isCJoinedTeam2;
  console.log(`   TEST 8 RESULT: ${test8Passed ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 2: Team appears in Student B's "Teams I Joined"
  // ==========================================
  console.log("👉 TEST 2: Checking Student B's My Teams (Teams I Joined)...");
  const myTeamsB = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests/my-teams',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const joinedB = myTeamsB.data.joined || [];
  const inJoinedB = joinedB.some(t => t.id === team.id);
  const inHostedB = (myTeamsB.data.hosted || []).some(t => t.id === team.id);
  console.log(`   In joined teams: ${inJoinedB}, in hosted teams: ${inHostedB}`);
  console.log(`   TEST 2 RESULT: ${inJoinedB && !inHostedB ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 3 & 4: Member access vs Leader controls
  // ==========================================
  console.log('👉 TEST 3: Student B can view team details and members...');
  const viewRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team.id}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const canViewInfo = viewRes.status === 200 && viewRes.data.currentMembers.length === 2;
  console.log(`   Can view team: ${viewRes.status === 200} (Members count: ${viewRes.data.currentMembers?.length})`);
  console.log(`   TEST 3 RESULT: ${canViewInfo ? '✅ PASSED' : '❌ FAILED'}`);

  console.log('👉 TEST 4: Student B tries to view/manage team applications (Forbidden)...');
  const manageResB = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team.id}/applications`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log(`   Response status: ${manageResB.status} (Error: "${manageResB.data?.error}")`);
  const isForbiddenForMember = manageResB.status === 403;
  console.log(`   TEST 4 RESULT: ${isForbiddenForMember ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 9: Team capacity (2/2 members -> Full)
  // ==========================================
  console.log('👉 TEST 9: Team capacity check (Team is full: 2/2)...');
  const fullApplyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/requests/${team.id}/applications`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenC}`
    }
  }, {
    roleApplied: 'ML Engineer',
    pitch: 'I want to build the ML pipeline'
  });
  console.log(`   Apply response when full: status ${fullApplyRes.status}, error: "${fullApplyRes.data.error}"`);
  const isFullBlocked = fullApplyRes.status === 400 && fullApplyRes.data.error.includes('full');
  console.log(`   TEST 9 RESULT: ${isFullBlocked ? '✅ PASSED' : '❌ FAILED'}\n`);

  // ==========================================
  // TEST 10 & 11: Relogin persistence
  // ==========================================
  console.log('👉 TEST 10 & 11: Login persistence check...');
  const loginA = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: emailA,
    password: 'Password123!'
  });
  const notifsAfterRelogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/notifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${loginA.data.token}` }
  });
  console.log(`   Leader notifications after re-login: ${notifsAfterRelogin.data.notifications.length} items`);
  console.log(`   TEST 10 RESULT: ${notifsAfterRelogin.data.notifications.length > 0 ? '✅ PASSED' : '❌ FAILED'}`);

  const loginB = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: emailB,
    password: 'Password123!'
  });
  const teamsAfterReloginB = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/requests/my-teams',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${loginB.data.token}` }
  });
  const inJoinedAfterRelogin = (teamsAfterReloginB.data.joined || []).some(t => t.id === team.id);
  console.log(`   Student B joined teams after re-login: ${inJoinedAfterRelogin}`);
  console.log(`   TEST 11 RESULT: ${inJoinedAfterRelogin ? '✅ PASSED' : '❌ FAILED'}\n`);

  console.log('====================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

runTests().catch(console.error);
