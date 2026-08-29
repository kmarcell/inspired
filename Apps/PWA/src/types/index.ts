/**
 * Inspired Yoga Platform Domain Models & Types
 * Mirroring Swift Models: User.swift, Post.swift, Community.swift, Studio.swift, SearchResult.swift
 */

// --- Privacy Settings & Visibility Levels ---
export type VisibilityLevel = 'public' | 'groups-only' | 'members-only';

export interface PrivacySettings {
  isProfilePublic: boolean;
  avatarPrivacy: VisibilityLevel;
  showJoinedGroups: VisibilityLevel;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  isProfilePublic: false,
  avatarPrivacy: 'groups-only',
  showJoinedGroups: 'members-only',
};

// --- User Profile ---
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  lastSearchArea?: string;
  joinedCommunities: string[];
  profilePictureUrl?: string;
  thumbnailUrl?: string;
  isAdmin?: boolean;
  privacySettings: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

// --- Post & Social Feed ---
export interface PostAuthor {
  id: string;
  username: string;
  thumbnailUrl?: string;
  avatarPrivacy: VisibilityLevel;
}

export type PostSourceType = 'area' | 'community';

export interface PostSource {
  type: PostSourceType;
  id?: string;
  name: string;
}

export interface PostStats {
  likeCount: number;
  commentCount: number;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  source: PostSource;
  stats: PostStats;
  createdAt: string;
}

// --- Community ---
export interface CommunityPrivacySettings {
  isPublic: boolean;
  membersCanPost: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  location_prefix: string;
  linkedStudioId?: string;
  engagementScore: number;
  privacySettings: CommunityPrivacySettings;
}

// --- Yoga Studio ---
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ModerationSettings {
  autoApproveMemberComments: boolean;
  guestCommentsEnabled: boolean;
}

export type StudioStatus = 'active' | 'temp_closed' | 'closed';

export interface YogaStudio {
  id: string;
  name: string;
  address: string;
  about?: string;
  rating: number;
  isClaimed: boolean;
  status?: StudioStatus;
  statusNote?: string;
  isClosed?: boolean;
  closedAt?: string;
  ownerId?: string;
  companyId?: string;
  reviewCount: number;
  location_prefix: string;
  engagementScore: number;
  moderationSettings: ModerationSettings;
  location: GeoPoint;
}

// --- Company Brand ---
export interface Company {
  id: string;
  name: string;
  ownerId: string;
  contactEmail: string;
  website?: string;
  description: string;
  createdAt: string;
}

// --- Search Results ---
export type SearchResultCategory = 'area' | 'community' | 'studio' | 'teacher';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: SearchResultCategory;
  locationPrefix?: string;
  metadata?: Record<string, unknown>;
  communityData?: Community;
  studioData?: YogaStudio;
}
