const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('./db');

async function initDb() {
  console.log('🔄 Initializing CampusConnect PostgreSQL database...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run schema migrations
    await query(schemaSql);
    console.log('✅ Tables created or verified successfully.');

    // Seed default user: Onkar Patil (Matches SAMPLE_USER_PROFILE in frontend)
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const userCheck = await query('SELECT id, password_hash FROM users WHERE id = $1', ['user-onkar']);
    if (userCheck.rows.length === 0) {
      console.log('🌱 Seeding default student profile (Onkar Patil)...');
      await query(
        `INSERT INTO users (
          id, email, password_hash, name, display_name, handle, role_title, college, major, grad_year,
          avatar_url, bio, experience_level, is_verified, skills, interests,
          github_url, linkedin_url, discord_handle
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16,
          $17, $18, $19
        )`,
        [
          'user-onkar',
          'onkar.patil@pict.edu',
          defaultPasswordHash,
          'Onkar Patil',
          'Onkar',
          '@onkar_dev',
          'Full-Stack Developer & UI Enthusiast',
          'PICT Pune',
          'B.E. Computer Engineering',
          '3rd Year (Class of 2027)',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          '3rd year Computer Engineering student at PICT Pune. Passionate about web development, hackathons, and building accessible tech solutions for students and communities.',
          'Intermediate',
          true,
          JSON.stringify(['React', 'JavaScript', 'Node.js', 'Python', 'FastAPI', 'Tailwind CSS', 'MongoDB', 'Git']),
          JSON.stringify(['Hackathons', 'Full-Stack Web', 'AI Tools', 'Open Source']),
          'https://github.com',
          'https://linkedin.com',
          'onkar_dev#5012'
        ]
      );

      // Seed hackathon history for Onkar
      await query(
        `INSERT INTO user_hackathons (user_id, name, award, project_name, event_date) VALUES 
         ($1, $2, $3, $4, $5),
         ($1, $6, $7, $8, $9)`,
        [
          'user-onkar',
          'Smart India Hackathon (SIH 2025)',
          '🏆 1st Prize - Software Edition',
          'KisanMitra - Smart Advisory for Rural Farmers',
          'Dec 2025',
          'HackNITK 2025',
          '🥈 2nd Place - Open Innovation Track',
          'CampusBite - Mess & Canteen Queue Tracker',
          'Sept 2025'
        ]
      );

      // Seed featured projects for Onkar
      await query(
        `INSERT INTO user_projects (user_id, title, description, tech_stack, stars, repo_link) VALUES 
         ($1, $2, $3, $4, $5, $6),
         ($1, $7, $8, $9, $10, $11)`,
        [
          'user-onkar',
          'KisanMitra Advisory',
          'Vernacular crop health assistant and mandi price predictor built for rural communities.',
          JSON.stringify(['React', 'FastAPI', 'PyTorch', 'Tailwind']),
          '64',
          'github.com/onkar-dev/kisan-mitra',
          'CollegeClub Portal',
          'Centralized club recruitment and event registration portal for campus students.',
          JSON.stringify(['React', 'Node.js', 'MongoDB']),
          '38',
          'github.com/onkar-dev/college-club'
        ]
      );
      console.log('✅ Student profile seeded.');
    } else if (!userCheck.rows[0].password_hash) {
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [defaultPasswordHash, 'user-onkar']);
      console.log('✅ Updated default student profile with password_hash.');
    }

    // Seed creator Aarav Sharma for initial request if not exists
    const aaravCheck = await query('SELECT id FROM users WHERE id = $1', ['user-aarav']);
    if (aaravCheck.rows.length === 0) {
      await query(
        `INSERT INTO users (
          id, email, name, display_name, handle, role_title, college, major, grad_year,
          avatar_url, bio, experience_level, is_verified, skills, interests
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15
        )`,
        [
          'user-aarav',
          'aarav.sharma@pict.edu',
          'Aarav Sharma',
          'Aarav',
          '@aarav_ml',
          'Team Lead / ML Dev',
          'PICT Pune • CE \'26',
          'B.E. Computer Engineering',
          '4th Year (Class of 2026)',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
          'B.E. Computer Engineering at PICT Pune. Passionate about computer vision and high-impact rural tech.',
          'Advanced',
          true,
          JSON.stringify(['Python', 'PyTorch', 'FastAPI', 'React']),
          JSON.stringify(['AI & ML', 'Hackathons', 'Social Impact'])
        ]
      );
    }

    // Seed initial team request: KisanSetu AI
    const reqCheck = await query('SELECT id FROM team_requests WHERE id = $1', ['req-1']);
    if (reqCheck.rows.length === 0) {
      console.log('🌱 Seeding demo team request (KisanSetu AI)...');
      await query(
        `INSERT INTO team_requests (
          id, creator_id, title, category, event_name, short_desc, full_desc,
          skills_required, tech_stack, members_needed, current_team_size,
          open_roles, experience_level, deadline, deadline_display, days_left,
          is_urgent, is_featured, requirements, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20
        )`,
        [
          'req-1',
          'user-aarav',
          'KisanSetu AI - Smart Agri Advisory & Crop Health',
          'Hackathons',
          'Smart India Hackathon (SIH 2026)',
          'Building an offline-first multilingual crop disease identifier and real-time mandi price predictor for farmers.',
          'We are preparing for Smart India Hackathon (SIH 2026) under the Agriculture & Rural Development theme. Our team is developing a fast, vernacular web & mobile application that lets farmers take photos of damaged crops to receive immediate diagnosis and treatment recommendations, alongside live commodity rates from nearby mandis.',
          JSON.stringify(['React', 'FastAPI', 'Tailwind CSS', 'Python']),
          JSON.stringify(['React 19', 'FastAPI', 'PyTorch', 'PostgreSQL', 'Tailwind']),
          4,
          3,
          JSON.stringify(['Frontend Developer (React & Tailwind) - 1 Spot Left']),
          'Intermediate',
          '2026-11-15',
          'Nov 15, 2026',
          8,
          true,
          true,
          JSON.stringify([
            'Good familiarity with React components and responsive UI design',
            'Able to coordinate during hackathon prep sessions and weekend syncs',
            'Bonus: Experience integrating REST APIs or building vernacular/multilingual interfaces'
          ]),
          'OPEN'
        ]
      );

      // Seed initial team members for req-1
      await query(
        `INSERT INTO team_members (request_id, user_id, name, role, college, avatar) VALUES 
         ($1, $2, $3, $4, $5, $6),
         ($1, $7, $8, $9, $10, $11),
         ($1, $12, $13, $14, $15, $16)`,
        [
          'req-1',
          'user-aarav',
          'Aarav Sharma',
          'Team Lead / ML',
          'PICT Pune',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80',
          null,
          'Priya Deshmukh',
          'UI/UX & Design',
          'PICT Pune',
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80',
          null,
          'Rohan Kulkarni',
          'Backend & Cloud',
          'PICT Pune',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80'
        ]
      );
      console.log('✅ Demo team request and roster seeded.');
    }

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}

if (require.main === module) {
  initDb()
    .then(() => pool.end())
    .catch(() => {
      pool.end();
      process.exit(1);
    });
}

module.exports = { initDb };
