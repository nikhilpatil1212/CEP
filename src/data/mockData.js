export const CATEGORIES = [
  'All',
  'Hackathons',
  'Course Projects',
  'Open Source',
  'Research & AI'
];

export const EXPERIENCE_LEVELS = [
  'All Levels',
  'Beginner Friendly',
  'Intermediate',
  'Advanced'
];

export const POPULAR_SKILLS = [
  'React', 'Python', 'FastAPI', 'Node.js', 'Figma', 
  'Tailwind CSS', 'PostgreSQL', 'PyTorch'
];

export const SAMPLE_USER_PROFILE = {
  id: 'user-onkar',
  email: 'onkar.patil@pict.edu',
  name: 'Onkar Patil',
  displayName: 'Onkar',
  handle: '@onkar_dev',
  role: 'Full-Stack Developer & UI Enthusiast',
  college: 'PICT Pune',
  major: 'B.E. Computer Engineering',
  year: '3rd Year (Class of 2027)',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: '3rd year Computer Engineering student at PICT Pune. Passionate about web development, hackathons, and building accessible tech solutions for students and communities.',
  experienceLevel: 'Intermediate',
  stats: {
    hackathonsAttended: 3,
    projectsBuilt: 5,
    podiumFinishes: 2,
    teamsJoined: 4
  },
  skills: [
    'React', 'JavaScript', 'Node.js', 'Python', 
    'FastAPI', 'Tailwind CSS', 'MongoDB', 'Git'
  ],
  interests: ['Hackathons', 'Full-Stack Web', 'AI Tools', 'Open Source'],
  hackathonHistory: [
    {
      name: 'Smart India Hackathon (SIH 2025)',
      award: '🏆 1st Prize - Software Edition',
      project: 'KisanMitra - Smart Advisory for Rural Farmers',
      date: 'Dec 2025'
    },
    {
      name: 'HackNITK 2025',
      award: '🥈 2nd Place - Open Innovation Track',
      project: 'CampusBite - Mess & Canteen Queue Tracker',
      date: 'Sept 2025'
    }
  ],
  featuredProjects: [
    {
      title: 'KisanMitra Advisory',
      desc: 'Vernacular crop health assistant and mandi price predictor built for rural communities.',
      stack: ['React', 'FastAPI', 'PyTorch', 'Tailwind'],
      stars: '64',
      link: 'github.com/onkar-dev/kisan-mitra'
    },
    {
      title: 'CollegeClub Portal',
      desc: 'Centralized club recruitment and event registration portal for campus students.',
      stack: ['React', 'Node.js', 'MongoDB'],
      stars: '38',
      link: 'github.com/onkar-dev/college-club'
    }
  ],
  links: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    discord: 'onkar_dev#5012',
    email: 'onkar.patil@pict.edu'
  }
};

// Clean slate: no hardcoded previous teams
export const INITIAL_REQUESTS = [];


// Fallback exports for cached tabs
export const HOW_IT_WORKS_STEPS = [];
export const PLATFORM_STATS = [];
export const UPCOMING_HACKATHONS = [];
