-- CampusConnect Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100),
    handle VARCHAR(100) UNIQUE NOT NULL,
    role_title VARCHAR(200) DEFAULT 'Student Builder',
    college VARCHAR(200) DEFAULT 'Campus Student',
    major VARCHAR(200),
    grad_year VARCHAR(100),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio TEXT DEFAULT '',
    experience_level VARCHAR(50) DEFAULT 'Intermediate',
    is_verified BOOLEAN DEFAULT TRUE,
    skills JSONB DEFAULT '[]'::jsonb,
    interests JSONB DEFAULT '[]'::jsonb,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    discord_handle VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing installations without password_hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. User Hackathons (Student Profile Portfolio)
CREATE TABLE IF NOT EXISTS user_hackathons (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    award VARCHAR(255),
    project_name VARCHAR(255),
    event_date VARCHAR(100)
);

-- 3. User Projects (Student Profile Portfolio)
CREATE TABLE IF NOT EXISTS user_projects (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    stars VARCHAR(50) DEFAULT '0',
    repo_link VARCHAR(255)
);

-- 4. Team Requests
CREATE TABLE IF NOT EXISTS team_requests (
    id VARCHAR(100) PRIMARY KEY,
    creator_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    short_desc VARCHAR(255) NOT NULL,
    full_desc TEXT,
    skills_required JSONB DEFAULT '[]'::jsonb,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    members_needed INT NOT NULL DEFAULT 4,
    current_team_size INT NOT NULL DEFAULT 1,
    open_roles JSONB DEFAULT '[]'::jsonb,
    experience_level VARCHAR(50) DEFAULT 'Intermediate',
    deadline VARCHAR(50),
    deadline_display VARCHAR(100),
    days_left INT DEFAULT 14,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    requirements JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'OPEN',
    owner_included BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_requests ADD COLUMN IF NOT EXISTS owner_included BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_requests_category ON team_requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON team_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_creator ON team_requests(creator_id);

-- 5. Team Members (Current Roster)
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) REFERENCES team_requests(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    college VARCHAR(150),
    avatar TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_request ON team_members(request_id);

-- 6. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(100) PRIMARY KEY,
    request_id VARCHAR(100) REFERENCES team_requests(id) ON DELETE CASCADE,
    applicant_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    applicant_name VARCHAR(150) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_college VARCHAR(150),
    applicant_avatar TEXT,
    role_applied VARCHAR(150) NOT NULL,
    pitch TEXT NOT NULL,
    portfolio_link VARCHAR(255),
    hours_commitment VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_applications_request ON applications(request_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    recipient_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    request_id VARCHAR(100) REFERENCES team_requests(id) ON DELETE CASCADE,
    application_id VARCHAR(100) REFERENCES applications(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
