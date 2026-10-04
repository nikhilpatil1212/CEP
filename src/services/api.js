// API service for CampusConnect frontend
import { SAMPLE_USER_PROFILE } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to get stored auth token
 */
export function getAuthToken() {
  return localStorage.getItem('campusconnect_token') || null;
}

/**
 * Helper to set stored auth token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('campusconnect_token', token);
  } else {
    localStorage.removeItem('campusconnect_token');
  }
}

/**
 * Helper to remove stored auth token
 */
export function removeAuthToken() {
  localStorage.removeItem('campusconnect_token');
}

/**
 * Helper to build auth headers
 */
function getHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Auth API: Register new user
 */
export async function authRegister(registrationData) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check your details.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      // Backend server not currently reachable on port 5000
      console.warn('Backend server offline at http://localhost:5000. Providing demo student session.');
      const cleanName = registrationData.name || 'Student Builder';
      const demoUser = {
        id: `user-${Date.now()}`,
        name: cleanName,
        displayName: cleanName.split(' ')[0],
        handle: `@${cleanName.toLowerCase().replace(/\s+/g, '')}_${Math.floor(100 + Math.random() * 900)}`,
        email: registrationData.email,
        college: registrationData.college || 'PICT Pune',
        role: registrationData.role || 'Student Builder',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
        bio: 'Student builder passionate about hackathons and tech.',
        experienceLevel: 'Intermediate',
        skills: ['React', 'JavaScript', 'Python'],
        interests: ['Hackathons', 'Full-Stack Web'],
        stats: { hackathonsAttended: 1, projectsBuilt: 2, podiumFinishes: 0, teamsJoined: 1 },
        hackathonHistory: [],
        featuredProjects: [],
        links: { github: 'https://github.com', linkedin: 'https://linkedin.com', discord: '', email: registrationData.email }
      };
      return {
        message: 'Account created successfully (Offline Demo Mode).',
        user: demoUser,
        token: `demo_jwt_token_${Date.now()}`
      };
    }
    throw err;
  }
}

/**
 * Auth API: Log in existing user
 */
export async function authLogin(credentials) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      // Backend server not currently reachable on port 5000
      console.warn('Backend server offline at http://localhost:5000. Providing demo session.');
      if (credentials.email === 'onkar.patil@pict.edu') {
        return {
          message: 'Logged in successfully as demo user.',
          user: {
            ...SAMPLE_USER_PROFILE,
            id: 'user-onkar',
            email: credentials.email
          },
          token: `demo_jwt_token_${Date.now()}`
        };
      }
      const cleanEmail = credentials.email.trim().toLowerCase();
      const prefix = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      const emailSlug = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      const deterministicUserId = `user-${emailSlug || Date.now()}`;
      return {
        message: 'Logged in successfully (Offline Demo Mode).',
        user: {
          ...SAMPLE_USER_PROFILE,
          id: deterministicUserId,
          name,
          displayName: name.split(' ')[0],
          email: credentials.email
        },
        token: `demo_jwt_token_${Date.now()}`
      };
    }
    throw err;
  }
}

/**
 * Auth API: Get currently authenticated user
 */
export async function authMe(token) {
  const authToken = token || getAuthToken();
  if (!authToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeAuthToken();
      }
      return null;
    }

    const data = await res.json();
    return data.user;
  } catch (err) {
    // If backend is offline but token is stored, return null or fallback
    return null;
  }
}

/**
 * Auth API: Reset password
 */
export async function authResetPassword({ email, newPassword, confirmNewPassword }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, confirmNewPassword })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      return {
        message: 'Password reset successfully (Offline Demo Mode). You can now log in.'
      };
    }
    throw err;
  }
}

/**
 * Fetch all team requests with optional category and search filters
 */
export async function getRequests(category = 'All', searchQuery = '') {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (searchQuery && searchQuery.trim()) params.append('search', searchQuery.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/requests${queryString}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch requests: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, falling back to local dataset:', err.message);
    return null;
  }
}

/**
 * Fetch a single team request by ID
 */
export async function getRequestById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/requests/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch request: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Error fetching request ${id}:`, err);
    return null;
  }
}

/**
 * Create a new team request (Protected: attaches auth token)
 */
export async function createRequest(requestData) {
  try {
    const res = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestData)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create request: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Could not post to backend server, falling back to local create:', err.message);
    return requestData;
  }
}

/**
 * Submit an application to join a team request (Protected: attaches auth token)
 */
export async function submitApplication(requestId, applicationData) {
  try {
    const res = await fetch(`${API_BASE_URL}/requests/${requestId}/applications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(applicationData)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to submit application: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable for application submission, using simulated demo:', err.message);
    const newApp = {
      id: `app-demo-${Date.now()}`,
      request_id: requestId,
      applicant_id: applicationData.applicantId || `user-${Date.now()}`,
      applicant_name: applicationData.applicantName || 'Campus Student',
      applicant_email: applicationData.applicantEmail || '',
      applicant_college: applicationData.applicantCollege || 'PICT Pune',
      applicant_avatar: applicationData.applicantAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
      role_applied: applicationData.roleApplied || 'Teammate',
      pitch: applicationData.pitch || '',
      portfolio_link: applicationData.portfolioLink || '',
      hours_commitment: applicationData.hoursCommitment || '10-15 hrs/week',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    try {
      const existing = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      existing.unshift(newApp);
      localStorage.setItem('campusconnect_demo_applications', JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not cache demo application:', e);
    }
    return { success: true, simulated: true, application: newApp };
  }
}

/**
 * Fetch the active student profile (fallback or public)
 */
export async function getUserProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`);
    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Fetch pending applications for teams owned by currently logged-in user
 */
export async function fetchOwnerNotifications() {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/notifications`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch notifications: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    try {
      const localApps = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      const pendingApps = localApps.filter(a => a.status === 'PENDING');
      return { count: pendingApps.length, applications: pendingApps };
    } catch (e) {
      return { count: 0, applications: [] };
    }
  }
}

/**
 * Accept an application and add applicant to team roster
 */
export async function acceptApplicationApi(applicationId) {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/accept`, {
      method: 'PATCH',
      headers: getHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to accept application.');
    }
    return data;
  } catch (err) {
    try {
      const localApps = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      const updated = localApps.map(a => a.id === applicationId ? { ...a, status: 'APPROVED' } : a);
      localStorage.setItem('campusconnect_demo_applications', JSON.stringify(updated));
    } catch (e) {}
    return { success: true, message: 'Application approved (Offline demo).' };
  }
}

/**
 * Decline/deny an application
 */
export async function rejectApplicationApi(applicationId) {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject`, {
      method: 'PATCH',
      headers: getHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to decline application.');
    }
    return data;
  } catch (err) {
    try {
      const localApps = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      const updated = localApps.map(a => a.id === applicationId ? { ...a, status: 'DENIED' } : a);
      localStorage.setItem('campusconnect_demo_applications', JSON.stringify(updated));
    } catch (e) {}
    return { success: true, message: 'Application denied (Offline demo).' };
  }
}

/**
 * Fetch teams created/owned by authenticated user (My Teams)
 */
export async function getMyTeams() {
  try {
    const res = await fetch(`${API_BASE_URL}/requests/my-teams`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Failed to fetch your teams: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Error fetching my-teams from backend:', err.message);
    try {
      const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
      return local;
    } catch (e) {
      return [];
    }
  }
}

/**
 * Update a team request (Owner only)
 */
export async function updateTeamApi(teamId, updateData) {
  const res = await fetch(`${API_BASE_URL}/requests/${teamId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updateData)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update team.');
  }
  return data;
}

/**
 * Delete a team request (Owner only)
 */
export async function deleteTeamApi(teamId) {
  // Always clean up from localStorage
  try {
    const local = JSON.parse(localStorage.getItem('campusconnect_local_requests') || '[]');
    const filtered = local.filter(r => r.id !== teamId);
    localStorage.setItem('campusconnect_local_requests', JSON.stringify(filtered));

    // Also clean up any demo applications for this team
    const demoApps = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
    const filteredApps = demoApps.filter(a => a.request_id !== teamId);
    localStorage.setItem('campusconnect_demo_applications', JSON.stringify(filteredApps));
  } catch (e) {
    console.warn('Error clearing team from localStorage:', e);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/requests/${teamId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 404) {
        return { message: 'Team post removed.', id: teamId };
      }
      throw new Error(data.error || 'Failed to delete team.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
      return { message: 'Team post deleted successfully (offline mode).', id: teamId };
    }
    throw err;
  }
}

/**
 * Fetch incoming applications for a team request (Owner only)
 */
export async function getTeamApplications(requestId) {
  const res = await fetch(`${API_BASE_URL}/requests/${requestId}/applications`, {
    headers: getHeaders()
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch team applications.');
  }
  return data;
}

/**
 * Fetch applications submitted by currently authenticated user (My Applications)
 */
export async function getMyApplications() {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/my-applications`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch my applications.');
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable for my-applications, using local cache:', err.message);
    try {
      const local = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      return local;
    } catch (e) {
      return [];
    }
  }
}

/**
 * Withdraw an application (Applicant only, must be PENDING)
 */
export async function withdrawApplicationApi(applicationId) {
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
    method: 'PATCH',
    headers: getHeaders()
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to withdraw application.');
  }
  return data;
}

/**
 * Delete / remove an application (Applicant or Team Owner)
 */
export async function deleteApplicationApi(applicationId) {
  try {
    const res = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete application.');
    }
    return data;
  } catch (err) {
    try {
      const local = JSON.parse(localStorage.getItem('campusconnect_demo_applications') || '[]');
      const filtered = local.filter(a => a.id !== applicationId);
      localStorage.setItem('campusconnect_demo_applications', JSON.stringify(filtered));
    } catch (e) {}
    return { success: true, message: 'Application removed.' };
  }
}

/**
 * Fetch notifications for authenticated user
 */
export async function getNotificationsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch notifications: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend notifications unavailable:', err.message);
    return { count: 0, unreadCount: 0, notifications: [] };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadApi(id) {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return await res.json().catch(() => ({}));
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsReadApi() {
  const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return await res.json().catch(() => ({}));
}

