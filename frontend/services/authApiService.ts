/**
 * Authentication API Service
 * Handles all authentication operations through the backend API
 * Replaces Appwrite authentication
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  uniqueId?: string;
  qrCode?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Signup failed');
  }

  const result = await response.json();
  
  // Store token in localStorage
  if (result.token) {
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  }

  return result;
}

/**
 * Login an existing user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Login failed');
  }

  const result = await response.json();
  
  // Store token in localStorage
  if (result.token) {
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  }

  return result;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }

  // Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid or expired
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return null;
    }

    const user = await response.json();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Profile update failed');
  }

  const user = await response.json();
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

/**
 * Change user password
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      oldPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Password change failed');
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Password reset request failed');
  }
}

/**
 * Get auth token for API requests
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}
