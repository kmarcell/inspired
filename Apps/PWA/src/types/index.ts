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
  email?: string;
  displayName?: string;
  bio?: string;
  lastSearchArea?: string;
  location_prefix?: string;
  joinedCommunities: string[];
  profilePictureUrl?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  isTeacher?: boolean;
  teachingStudios?: string[];
  subscriberCount?: number;
  postCount?: number;
  isAdmin?: boolean;
  isProfilePublic?: boolean;
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

export type CommunityType = 'area' | 'brand';

export interface Community {
  id: string;
  name: string;
  description: string;
  location_prefix: string;
  communityType?: CommunityType;
  bannerImageUrl?: string;
  emblemUrl?: string;
  linkedStudioId?: string;
  studioBranchIds?: string[];
  memberCount?: number;
  postCount?: number;
  engagementScore: number;
  privacySettings: CommunityPrivacySettings;
  createdAt?: string;
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

export type RoomClimateType = 
  | 'hot_studio'      // 🔥 Hot Studio (e.g. 35°C / 28°C)
  | 'air_conditioned' // ❄️ Air Conditioned
  | 'heated_room'     // 🌡️ Heated Room
  | 'natural_ambient' // 🍃 Natural Ambient
  | 'outdoor';        // ☀️ Outdoor

export interface StudioTeacher {
  id: string;
  displayName: string;
  photoUrl?: string;
  specialty?: string;
  isPublic?: boolean;
}

export interface StudioMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isProfilePublic: boolean;
  joinedAt: string;
}

export interface StudioClass {
  id: string;
  studioId: string;
  className: string;
  title?: string;
  studioName?: string;
  classTypeDescription: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dateString: string; // ISO date string e.g. "2026-08-31"
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "11:00 AM"
  capacity: number;  // e.g. 24
  maxCapacity?: number;
  bookedCount: number;
  waitlist: string[]; // array of userIds in waitlist order
  roomClimate: RoomClimateType;
  temperatureCelsius?: number; // Custom numeric temperature in °C set by studio admin (e.g. 28, 35, 40)
  equipmentNeeded?: string;    // e.g. "Yoga Mat & Towel"
  skillLevel?: string;         // e.g. "All Levels Welcome"
  styleName?: string;          // e.g. "Dynamic Vinyasa"
}

export interface CreateStudioClassInput {
  studioId: string;
  className: string;
  classTypeDescription: string;
  teacherId: string;
  teacherName: string;
  dateString: string; // ISO date string e.g. "2026-08-31"
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "11:00 AM"
  capacity: number;  // e.g. 24
  roomClimate: RoomClimateType;
  temperatureCelsius?: number; // Admin-configurable temperature input (°C) when roomClimate === 'hot_studio'
  equipmentNeeded?: string;
  skillLevel?: string;
  styleName?: string;
}

export interface ClassBooking {
  id: string;
  classId: string;
  studioId: string;
  userId: string;
  userDisplayName: string;
  bookedAt: string; // ISO Timestamp
  status: 'confirmed' | 'waitlisted';
  waitlistPosition?: number;
  passIdUsed?: string;
  creditsRedeemed?: number;
}

// --- Section 5.20: Brand Currency Catalog, Studio Acceptance Policies & User Pass Wallet ---

export type CurrencyTierType = 'drop_in' | 'credit_pack' | 'unlimited';
export type UnlimitedPeriodType = 'weekly' | 'monthly' | 'yearly';

export interface PromoOffer {
  promoDiscountPercent: number; // e.g. 40 for 40% OFF
  promoStartDate: string;       // ISO Date e.g. "2026-06-01"
  promoEndDate: string;         // ISO Date e.g. "2026-08-31"
  promoTitle?: string;          // e.g. "Summer Special 40% OFF"
}

export interface CompanyCurrency {
  id: string;
  companyId: string;           // Parent Brand ID
  studioId?: string;           // Present if created by a specific studio branch as a custom override
  title: string;               // e.g. "5-Class Pack (Summer Special)"
  description: string;         // e.g. "Valid for 5 Hot Yoga classes across all brand studios"
  tierType: CurrencyTierType;
  creditCount?: number;        // Total credits granted (e.g. 1, 5, 10). Omitted if unlimited.
  basePriceAmount: number;     // Standard price e.g. 60.00
  currencySymbol: string;      // e.g. "£", "$", "€"
  validityDays: number;        // Pass lifespan e.g. 30, 60, 365
  unlimitedPeriod?: UnlimitedPeriodType; // Present if tierType === 'unlimited'
  promoOffer?: PromoOffer;
  allowedStudioIds: string[] | 'all'; // Studios where this currency is valid
  createdAt: string;
  updatedAt: string;
}

export type StudioCurrencyPolicyMode = 'follow_brand' | 'custom_override';

export interface StudioCurrencyPolicy {
  studioId: string;
  companyId?: string;
  policyMode: StudioCurrencyPolicyMode;
  acceptedCurrencyIds: string[]; // List of CompanyCurrency IDs accepted by this studio
  customCurrencies?: CompanyCurrency[]; // Custom studio-level pricing tiers (if policyMode === 'custom_override')
  updatedAt: string;
}

export type UserPassStatus = 'active' | 'expired' | 'exhausted';

export interface UserPass {
  id: string;
  userId: string;
  currencyId: string;
  currencyTitle: string;
  studioId?: string;            // Primary studio branch ID (or empty if global brand pass)
  companyId?: string;
  tierType: CurrencyTierType;
  totalCredits?: number;
  creditsRemaining?: number;
  unlimitedPeriod?: UnlimitedPeriodType;
  validityDays: number;
  purchasedAt: string;          // ISO Timestamp
  expiresAt: string;            // ISO Timestamp
  status: UserPassStatus;
  grantedByAdminId?: string;    // Admin UID if granted via front-desk POS / Staging admin tool
  grantNote?: string;           // Grant note e.g. "Cash Payment Recorded (£20)"
}

export interface YogaStudio {
  id: string;
  name: string;
  address: string;
  about?: string;
  description?: string;
  rating: number;
  isClaimed: boolean;
  status?: StudioStatus;
  statusNote?: string;
  isClosed?: boolean;
  closedAt?: string;
  ownerId?: string;
  companyId?: string;
  parentBrandCommunityId?: string;
  parentBrandName?: string;
  reviewCount: number;
  membersCount?: number;
  location_prefix: string;
  engagementScore: number;
  moderationSettings: ModerationSettings;
  location: GeoPoint;
  coverImageUrl?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  assignedTeacherIds?: string[];
  assignedTeachers?: StudioTeacher[];
}

// --- Company Brand ---
export interface Company {
  id: string;
  name: string;
  ownerId: string;
  contactEmail: string;
  website?: string;
  description: string;
  bannerImageUrl?: string;
  logoUrl?: string;
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

// --- Staging Invite Status & Record ---
export type StagingInviteStatus = 'pending' | 'sent' | 'failed';

export interface StagingInvite {
  id: string;
  email: string;
  status: StagingInviteStatus;
  errorReason?: string;
  invitedBy?: string;
  createdAt: string;
  sentAt?: string;
  failedAt?: string;
}

