import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { firestoreService, ProfileNotFoundError } from '../../services/firestoreService';

// Mock Firebase Auth and Firestore Service
let authStateCallback: ((user: unknown) => void) | null = null;

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    authStateCallback = cb;
    // Initial state: launching -> login (no user)
    cb(null);
    return vi.fn();
  }),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
  app: {},
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    fetchUserProfile: vi.fn(),
  },
  ProfileNotFoundError: class ProfileNotFoundError extends Error {
    constructor(userId: string) {
      super(`Profile not found: ${userId}`);
      this.name = 'ProfileNotFoundError';
    }
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

const TestComponent = () => {
  const { status, user, onboardingUserId } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="username">{user?.username || ''}</span>
      <span data-testid="onboarding-id">{onboardingUserId || ''}</span>
    </div>
  );
};

describe('AuthContext State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial login status when no Firebase user exists', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('status').textContent).toBe('login');
  });

  it('transitions to authenticated state when user profile is found', async () => {
    const mockProfile = {
      id: 'user_123',
      username: 'yoga_jane#1234',
      joinedCommunities: [],
      privacySettings: { isProfilePublic: false, avatarPrivacy: 'groups-only', showJoinedGroups: 'members-only' },
      createdAt: '2026-08-28T10:00:00.000Z',
      updatedAt: '2026-08-28T10:00:00.000Z',
    };

    vi.spyOn(firestoreService, 'fetchUserProfile').mockResolvedValueOnce(mockProfile as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate logged in user
    if (authStateCallback) {
      authStateCallback({ uid: 'user_123', displayName: 'Jane Doe' });
    }

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
      expect(screen.getByTestId('username').textContent).toBe('yoga_jane#1234');
    });
  });

  it('transitions to onboarding state when user profile is not found', async () => {
    vi.spyOn(firestoreService, 'fetchUserProfile').mockRejectedValueOnce(
      new ProfileNotFoundError('user_new_456')
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    if (authStateCallback) {
      authStateCallback({ uid: 'user_new_456', displayName: 'New User' });
    }

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('onboarding');
      expect(screen.getByTestId('onboarding-id').textContent).toBe('user_new_456');
    });
  });
});
