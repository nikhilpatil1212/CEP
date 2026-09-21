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

// ONLY ONE MOCK TEAM FOR CLEAN DEMO
export const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    title: 'KisanSetu AI - Smart Agri Advisory & Crop Health',
    category: 'Hackathons',
    eventName: 'Smart India Hackathon (SIH 2026)',
    shortDesc: 'Building an offline-first multilingual crop disease identifier and real-time mandi price predictor for farmers.',
    fullDesc: 'We are preparing for Smart India Hackathon (SIH 2026) under the Agriculture & Rural Development theme. Our team is developing a fast, vernacular web & mobile application that lets farmers take photos of damaged crops to receive immediate diagnosis and treatment recommendations, alongside live commodity rates from nearby mandis.',
    creator: {
      name: 'Aarav Sharma',
      college: 'PICT Pune • CE \'26',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      role: 'Team Lead / ML Dev',
      bio: 'B.E. Computer Engineering at PICT Pune. Passionate about computer vision and high-impact rural tech.'
    },
    skillsRequired: ['React', 'FastAPI', 'Tailwind CSS', 'Python'],
    techStack: ['React 19', 'FastAPI', 'PyTorch', 'PostgreSQL', 'Tailwind'],
    membersNeeded: 4,
    currentTeamSize: 3,
    openRoles: ['Frontend Developer (React & Tailwind) - 1 Spot Left'],
    currentMembers: [
      {
        name: 'Aarav Sharma',
        role: 'Team Lead / ML',
        college: 'PICT Pune',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80'
      },
      {
        name: 'Priya Deshmukh',
        role: 'UI/UX & Design',
        college: 'PICT Pune',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80'
      },
      {
        name: 'Rohan Kulkarni',
        role: 'Backend & Cloud',
        college: 'PICT Pune',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80'
      }
    ],
    experienceLevel: 'Intermediate',
    deadline: '2026-11-15',
    deadlineDisplay: 'Nov 15, 2026',
    daysLeft: 8,
    urgent: true,
    featured: true,
    requirements: [
      'Good familiarity with React components and responsive UI design',
      'Able to coordinate during hackathon prep sessions and weekend syncs',
      'Bonus: Experience integrating REST APIs or building vernacular/multilingual interfaces'
    ]
  }
];

// Fallback exports for cached tabs
export const HOW_IT_WORKS_STEPS = [];
export const PLATFORM_STATS = [];
export const UPCOMING_HACKATHONS = [];
