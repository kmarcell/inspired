import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc,
  collection, 
  query, 
  where, 
  documentId,
  orderBy, 
  limit, 
  getDocs,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, app } from '../firebase';
import { UserProfile, Post, Community, YogaStudio, Company, SearchResult, StudioClass, ClassBooking, StudioMember, StagingInvite, CompanyCurrency, StudioCurrencyPolicy, UserPass } from '../types';

export class ProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`Profile not found for userId: ${userId}`);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfileValidationError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = 'ProfileValidationError';
  }
}

/** Helper utility to split an array into chunks of a specified size (Firestore `in` query limit is 30) */
export function chunkArray<T>(array: T[], chunkSize: number = 30): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export const firestoreService = {
  /** Fetch full user profile by userId or email address */
  async fetchUserProfile(userId: string, email?: string): Promise<UserProfile> {
    const userDocRef = doc(db, 'users', userId);
    let snapshot = await getDoc(userDocRef);

    // If not found by direct UID, try querying by email address (e.g. Google Sign-In or Magic Link binding)
    if ((!snapshot.exists() || !snapshot.data()?.username) && email) {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const emailSnap = await getDocs(q);
      if (!emailSnap.empty) {
        snapshot = emailSnap.docs[0];
      }
    }

    if (!snapshot.exists() || !snapshot.data()?.username) {
      throw new ProfileNotFoundError(userId);
    }
    const data = snapshot.data();
    return {
      id: snapshot.id,
      username: data.username || 'unknown',
      email: data.email || email || undefined,
      displayName: data.displayName,
      bio: data.bio,
      lastSearchArea: data.lastSearchArea,
      joinedCommunities: data.joinedCommunities || [],
      profilePictureUrl: data.profilePictureUrl,
      thumbnailUrl: data.thumbnailUrl,
      privacySettings: data.privacySettings || {
        isProfilePublic: false,
        avatarPrivacy: 'groups-only',
        showJoinedGroups: 'members-only',
      },
      isAdmin: data.isAdmin === true,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  },

  /** Create a new user profile document in Firestore */
  async createUserProfile(user: UserProfile): Promise<void> {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      ...user,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /** Validate proposed display name using callable Cloud Function */
  async validateDisplayName(displayName: string): Promise<boolean> {
    if (displayName.trim().length < 2) {
      throw new ProfileValidationError('Display name must be at least 2 characters.');
    }

    try {
      const functions = getFunctions(app, 'europe-west2');
      const validateFn = httpsCallable<{ displayName: string }, { isValid: boolean; reason?: string }>(
        functions, 
        'validateDisplayName'
      );
      const response = await validateFn({ displayName });
      if (!response.data.isValid) {
        throw new ProfileValidationError(response.data.reason || 'Invalid display name.');
      }
      return true;
    } catch (err: unknown) {
      if (err instanceof ProfileValidationError) throw err;
      // If Cloud Function endpoint is unavailable during local dev, default fallback
      console.warn('[firestoreService] validateDisplayName fallback check applied:', err);
      return true;
    }
  },

  /** Search communities and studios by postcode prefix, area name, or partial keyword */
  async searchEntities(queryStr: string, _currentAreaPrefix: string = 'W12'): Promise<SearchResult[]> {
    const qTrim = queryStr.trim().toLowerCase();
    if (!qTrim) return [];

    const results: SearchResult[] = [];

    // Map known area names to outward code prefixes
    const areaPrefixMap: Record<string, string> = {
      hammersmith: 'w6',
      askew: 'w12',
      chelsea: 'sw3',
    };

    const mappedPrefix = areaPrefixMap[qTrim];

    try {
      // Fetch public communities
      const commQuery = query(
        collection(db, 'communities'),
        where('privacySettings.isPublic', '==', true)
      );
      const commSnap = await getDocs(commQuery);
      const communities: Community[] = commSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          description: d.description,
          location_prefix: d.location_prefix,
          linkedStudioId: d.linkedStudioId,
          engagementScore: d.engagementScore,
          privacySettings: d.privacySettings,
        } as Community;
      });

      if (communities.length === 0) {
        communities.push(
          {
            id: 'comm_brand_affordable_london',
            name: 'Affordable London Yoga Network',
            description: 'Parent brand community aggregating all studio branch updates across London.',
            location_prefix: 'W12, W4',
            communityType: 'brand',
            engagementScore: 1250,
            privacySettings: { isPublic: true, membersCanPost: true },
          },
          {
            id: 'comm_askew_area',
            name: 'Askew Area Yoga Community',
            description: 'Local neighborhood yoga community for Askew & Shepherd\'s Bush yogis.',
            location_prefix: 'W12',
            communityType: 'area',
            engagementScore: 920,
            privacySettings: { isPublic: true, membersCanPost: true },
          },
          {
            id: 'comm_area_W12',
            name: 'W12 Shepherd’s Bush Yogis',
            description: 'Local neighborhood area feed for yogis in Shepherd’s Bush and Askew Road.',
            location_prefix: 'W12',
            communityType: 'area',
            engagementScore: 810,
            privacySettings: { isPublic: true, membersCanPost: true },
          }
        );
      }

      // Fetch studios
      const studioQuery = query(collection(db, 'studios'));
      const studioSnap = await getDocs(studioQuery);
      const studios: YogaStudio[] = studioSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          address: d.address,
          about: d.about,
          rating: d.rating,
          isClaimed: d.isClaimed,
          status: d.status || (d.isClosed ? 'closed' : 'active'),
          statusNote: d.statusNote || undefined,
          isClosed: d.isClosed || d.status === 'closed' || false,
          closedAt: d.closedAt || undefined,
          ownerId: d.ownerId,
          companyId: d.companyId || undefined,
          parentBrandName: d.parentBrandName || undefined,
          parentBrandCommunityId: d.parentBrandCommunityId || undefined,
          membersCount: d.membersCount || 0,
          reviewCount: d.reviewCount,
          location_prefix: d.location_prefix,
          engagementScore: d.engagementScore,
          moderationSettings: d.moderationSettings,
          location: d.location,
          assignedTeachers: d.assignedTeachers || [],
        } as YogaStudio;
      });

      // Filter Communities
      communities.forEach((comm) => {
        const commNameLower = comm.name.toLowerCase();
        const commDescLower = comm.description.toLowerCase();
        const commPrefixLower = comm.location_prefix.toLowerCase();

        let matches = false;
        let priority = 3; // 1 = Area/Postcode match, 2 = Name match, 3 = Keyword match

        if (mappedPrefix && commPrefixLower === mappedPrefix) {
          matches = true;
          priority = 1;
        } else if (commPrefixLower.startsWith(qTrim)) {
          matches = true;
          priority = 1;
        } else if (commNameLower.includes(qTrim)) {
          matches = true;
          priority = 2;
        } else if (commDescLower.includes(qTrim)) {
          matches = true;
          priority = 3;
        }

        if (matches) {
          results.push({
            id: comm.id,
            title: comm.name,
            subtitle: `${comm.location_prefix} • ${comm.description}`,
            category: comm.id.startsWith('area_') ? 'area' : 'community',
            locationPrefix: comm.location_prefix,
            metadata: { priority, engagementScore: comm.engagementScore },
            communityData: comm,
          });
        }
      });



      // Search & Match Studios
      studios.forEach((studio) => {
        // Pending studios awaiting admin verification (unapproved user-created studios) are hidden from Search & Explore
        if (studio.isClaimed === false && studio.ownerId) {
          return;
        }

        const studioNameLower = studio.name.toLowerCase();
        const studioAboutLower = (studio.about || '').toLowerCase();
        const studioPrefixLower = studio.location_prefix.toLowerCase();

        let matches = false;
        let priority = 3;

        if (mappedPrefix && studioPrefixLower === mappedPrefix) {
          matches = true;
          priority = 1;
        } else if (studioPrefixLower.startsWith(qTrim)) {
          matches = true;
          priority = 1;
        } else if (studioNameLower.includes(qTrim)) {
          matches = true;
          priority = 2;
        } else if (studioAboutLower.includes(qTrim)) {
          matches = true;
          priority = 3;
        }

        if (matches) {
          results.push({
            id: studio.id,
            title: studio.name,
            subtitle: `${studio.location_prefix} • ${studio.address}`,
            category: 'studio',
            locationPrefix: studio.location_prefix,
            metadata: { priority, rating: studio.rating },
            studioData: studio,
          });
        }
      });

      // Sort by Priority (1 > 2 > 3), then title
      results.sort((a, b) => {
        const pA = (a.metadata?.priority as number) || 3;
        const pB = (b.metadata?.priority as number) || 3;
        if (pA !== pB) return pA - pB;
        return a.title.localeCompare(b.title);
      });

      return results;
    } catch (err) {
      console.error('[firestoreService] searchEntities error:', err);
      return [];
    }
  },

  /** 
   * Fetch feed posts for a given area and joined communities.
   * Enforces 30-item chunking for community IDs in Firestore queries.
   */
  async fetchFeed(area: string, communityIds: string[], daysBack: number = 365): Promise<Post[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    let allPosts: Post[] = [];

    // Query 1: Fetch Area Posts
    try {
      const areaQuery = query(
        collection(db, 'posts'),
        where('source.type', '==', 'area'),
        where('source.name', '==', area),
        where('createdAt', '>', cutoffTimestamp),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      const areaSnapshot = await getDocs(areaQuery);
      const areaPosts = areaSnapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          author: d.author,
          content: d.content,
          source: d.source,
          stats: d.stats,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
        } as Post;
      });
      allPosts.push(...areaPosts);
    } catch (err) {
      console.warn('[firestoreService] Area query with cutoff failed/empty, executing fallback query:', err);
    }

    if (allPosts.length === 0) {
      try {
        const fallbackQuery = query(
          collection(db, 'posts'),
          where('source.type', '==', 'area'),
          where('source.name', '==', area),
          orderBy('createdAt', 'desc'),
          limit(25)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackPosts = fallbackSnapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            author: d.author,
            content: d.content,
            source: d.source,
            stats: d.stats,
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
          } as Post;
        });
        allPosts.push(...fallbackPosts);
      } catch (err) {
        console.error('[firestoreService] Fallback area query failed:', err);
      }
    }

    // Query 2: Fetch Joined Communities Posts (in chunks of 30)
    if (communityIds.length > 0) {
      const communityChunks = chunkArray(communityIds, 30);
      for (const chunk of communityChunks) {
        const commQuery = query(
          collection(db, 'posts'),
          where('source.id', 'in', chunk),
          where('createdAt', '>', cutoffTimestamp),
          orderBy('createdAt', 'desc'),
          limit(25)
        );
        const commSnapshot = await getDocs(commQuery);
        const commPosts = commSnapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            author: d.author,
            content: d.content,
            source: d.source,
            stats: d.stats,
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
          } as Post;
        });
        allPosts.push(...commPosts);
      }
    }

    // Deduplicate posts by ID and sort descending by date
    const uniqueMap = new Map<string, Post>();
    allPosts.forEach((post) => uniqueMap.set(post.id, post));
    const uniquePosts = Array.from(uniqueMap.values());

    uniquePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return uniquePosts.slice(0, 25);
  },

  /** Fetch posts for a specific studio or community feed */
  async fetchCommunityFeed(communityId: string): Promise<Post[]> {
    const rawStudioId = communityId.replace('comm_studio_', '');
    const altStudioId = communityId.startsWith('comm_studio_') ? communityId : `comm_studio_${communityId}`;

    const targetIds = [communityId, rawStudioId, altStudioId];

    if (communityId.includes('brand')) {
      const branches = await this.fetchStudiosByLocation('');
      const matchingBranches = branches.filter((st) => st.parentBrandCommunityId === communityId);
      matchingBranches.forEach((st) => {
        targetIds.push(st.id);
        targetIds.push(`comm_studio_${st.id}`);
      });
    } else {
      const comm = await this.fetchCommunityById(communityId);
      if (comm) {
        if (comm.id.includes('askew') || comm.location_prefix === 'W12') {
          targetIds.push('comm_askew_area', 'area_askew', 'comm_area_W12', 'studio_askew_001', 'comm_studio_studio_askew_001');
        } else if (comm.id.includes('ravenscourt') || comm.location_prefix === 'W6') {
          targetIds.push('comm_ravenscourt_yoga', 'area_hammersmith', 'studio_ravenscourt_003', 'comm_studio_studio_ravenscourt_003');
        } else if (comm.id.includes('chelsea') || comm.location_prefix === 'SW3') {
          targetIds.push('area_chelsea', 'studio_chelsea_004', 'comm_studio_studio_chelsea_004');
        }
      }
    }

    const uniqueTargetIds = Array.from(new Set(targetIds)).filter(Boolean);

    try {
      const chunks = chunkArray(uniqueTargetIds, 30);
      const allPosts: Post[] = [];

      for (const chunk of chunks) {
        const q = query(
          collection(db, 'posts'),
          where('source.id', 'in', chunk),
          orderBy('createdAt', 'desc'),
          limit(25)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            author: d.author,
            content: d.content,
            source: d.source,
            stats: d.stats,
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
          } as Post;
        });
        allPosts.push(...fetched);
      }

      // Deduplicate posts by ID and sort descending by date
      const uniqueMap = new Map<string, Post>();
      allPosts.forEach((p) => uniqueMap.set(p.id, p));
      const posts = Array.from(uniqueMap.values());
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return posts.slice(0, 25);
    } catch (e) {
      console.warn('[firestoreService] fetchCommunityFeed error:', e);
      return [];
    }
  },

  /** Fetch posts created by a specific user (author.id == userId) */
  async fetchUserPosts(userId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('author.id', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          author: d.author,
          content: d.content,
          source: d.source,
          stats: d.stats,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
        } as Post;
      });
    } catch (e) {
      console.warn('[firestoreService] fetchUserPosts query without index fallback:', e);
      try {
        const qFallback = query(
          collection(db, 'posts'),
          where('author.id', '==', userId),
          limit(25)
        );
        const snapshot = await getDocs(qFallback);
        const posts = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            author: d.author,
            content: d.content,
            source: d.source,
            stats: d.stats,
            createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt,
          } as Post;
        });
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return posts;
      } catch (err) {
        console.error('[firestoreService] fetchUserPosts error:', err);
        return [];
      }
    }
  },

  /** Fetch suggested communities for Discovery Mode sorted by engagementScore */
  async fetchSuggestedCommunities(area: string): Promise<Community[]> {
    console.log('[firestoreService] Fetching suggested communities for area:', area);
    try {
      const q = query(
        collection(db, 'communities'),
        where('privacySettings.isPublic', '==', true),
        orderBy('engagementScore', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name,
            description: d.description,
            location_prefix: d.location_prefix,
            linkedStudioId: d.linkedStudioId,
            engagementScore: d.engagementScore,
            privacySettings: d.privacySettings,
          } as Community;
        });
      }
      return [];
    } catch (e) {
      console.warn('[firestoreService] Suggested communities fetch error:', e);
      return [];
    }
  },

  /**
   * Fetch a single community by ID
   */
  async fetchCommunityById(communityId: string): Promise<Community | null> {
    try {
      const docSnap = await getDoc(doc(db, 'communities', communityId));
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          description: d.description,
          location_prefix: d.location_prefix,
          linkedStudioId: d.linkedStudioId,
          communityType: d.communityType || (d.id?.includes('brand') ? 'brand' : 'area'),
          engagementScore: d.engagementScore || 500,
          privacySettings: d.privacySettings || { isPublic: true, membersCanPost: true },
        } as Community;
      }
    } catch (e) {
      console.warn('[firestoreService] fetchCommunityById error:', e);
    }
    return null;
  },

  /** Detect nearest area for user */
  async detectNearestArea(): Promise<string> {
    return 'Askew';
  },

  /** Fetch details for a list of community IDs */
  async fetchCommunitiesByIds(communityIds: string[]): Promise<Community[]> {
    if (communityIds.length === 0) return [];

    const chunks = chunkArray(communityIds, 30);
    const communities: Community[] = [];

    for (const chunk of chunks) {
      try {
        const q = query(
          collection(db, 'communities'),
          where(documentId(), 'in', chunk)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name, // Uses stored community name
            description: d.description,
            location_prefix: d.location_prefix,
            linkedStudioId: d.linkedStudioId,
            communityType: d.communityType,
            engagementScore: d.engagementScore,
            privacySettings: d.privacySettings,
          } as Community;
        });
        communities.push(...fetched);
      } catch (e) {
        console.warn('[firestoreService] fetchCommunitiesByIds fallback:', e);
      }
    }

    // Fallback for missing seed items
    const suggested = await this.fetchSuggestedCommunities('');
    for (const id of communityIds) {
      if (!communities.some((c) => c.id === id)) {
        const found = suggested.find((s) => s.id === id);
        if (found) {
          communities.push(found);
        } else if (id.startsWith('studio_') || id.startsWith('comm_studio_')) {
          const studioId = id.replace('comm_studio_', '');
          const studio = await this.fetchStudioById(studioId);
          if (studio) {
            communities.push({
              id: id,
              name: studio.name,
              description: studio.description || `Official feed for ${studio.name}.`,
              location_prefix: studio.location_prefix,
              linkedStudioId: studio.id,
              engagementScore: 950,
              privacySettings: { isPublic: true, membersCanPost: true },
            });
          }
        }
      }
    }

    return communities;
  },

  /** Update user joinedCommunities in Firestore */
  async updateUserCommunities(userId: string, joinedCommunities: string[]): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { joinedCommunities }, { merge: true });
  },

  /** Update generic user profile fields in Firestore */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, updates, { merge: true });
  },

  /** Create a new Company Brand in Firestore */
  async createCompany(
    ownerId: string,
    companyData: {
      name: string;
      contactEmail: string;
      website?: string;
      description: string;
      bannerImageUrl?: string;
      logoUrl?: string;
    }
  ): Promise<Company> {
    const companiesRef = collection(db, 'companies');
    const docData = {
      name: companyData.name.trim(),
      ownerId,
      contactEmail: companyData.contactEmail.trim(),
      website: companyData.website?.trim() || null,
      description: companyData.description.trim(),
      bannerImageUrl: companyData.bannerImageUrl?.trim() || null,
      logoUrl: companyData.logoUrl?.trim() || null,
      createdAt: Timestamp.now().toDate().toISOString(),
    };
    const newDocRef = await addDoc(companiesRef, docData);
    return {
      id: newDocRef.id,
      ...docData,
      website: docData.website || undefined,
      bannerImageUrl: docData.bannerImageUrl || undefined,
      logoUrl: docData.logoUrl || undefined,
    };
  },

  /** Fetch all Companies on the platform */
  async fetchAllCompanies(): Promise<Company[]> {
    const snapshot = await getDocs(collection(db, 'companies'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
  },

  /** Fetch all Companies owned by a user (auto-prunes orphan studio-less brands & deduplicates by name) */
  async fetchCompaniesByOwner(ownerId: string): Promise<Company[]> {
    const [companiesSnap, studiosSnap] = await Promise.all([
      getDocs(query(collection(db, 'companies'), where('ownerId', '==', ownerId))),
      getDocs(query(collection(db, 'studios'), where('ownerId', '==', ownerId))),
    ]);

    const activeCompanyIdsWithStudios = new Set(
      studiosSnap.docs.map((d) => d.data().companyId).filter(Boolean)
    );

    const companies: Company[] = [];
    for (const docSnap of companiesSnap.docs) {
      const d = docSnap.data();
      // Auto-delete orphan studio-less company documents in background if 0 studios exist for it
      if (activeCompanyIdsWithStudios.size > 0 && !activeCompanyIdsWithStudios.has(docSnap.id)) {
        try {
          await deleteDoc(doc(db, 'companies', docSnap.id));
        } catch {
          // Ignore background cleanup errors
        }
        continue;
      }

      companies.push({
        id: docSnap.id,
        name: d.name,
        ownerId: d.ownerId,
        contactEmail: d.contactEmail,
        website: d.website || undefined,
        description: d.description,
        createdAt: d.createdAt,
      } as Company);
    }

    const uniqueByName = new Map<string, Company>();
    companies.forEach((comp) => {
      const key = comp.name.toLowerCase().trim();
      if (!uniqueByName.has(key)) {
        uniqueByName.set(key, comp);
      }
    });

    return Array.from(uniqueByName.values());
  },

  /** Update Company Brand details (triggers re-verification if website URL changes) */
  async updateCompany(
    companyId: string,
    companyData: {
      name: string;
      contactEmail: string;
      website?: string;
      description?: string;
    }
  ): Promise<void> {
    const compRef = doc(db, 'companies', companyId);
    const compSnap = await getDoc(compRef);
    const existingData = compSnap.exists() ? compSnap.data() : null;

    const newWebsite = companyData.website?.trim() || null;
    const oldWebsite = existingData?.website || null;
    const isWebsiteChanged = oldWebsite !== newWebsite && existingData !== null;

    await updateDoc(compRef, {
      name: companyData.name.trim(),
      contactEmail: companyData.contactEmail.trim(),
      website: newWebsite,
      description: companyData.description?.trim() || null,
    });

    if (isWebsiteChanged && newWebsite) {
      // Revert verification status for studios under this company brand
      const q = query(collection(db, 'studios'), where('companyId', '==', companyId));
      const studiosSnap = await getDocs(q);

      for (const studioDoc of studiosSnap.docs) {
        const stData = studioDoc.data();
        if (stData.isClaimed) {
          await updateDoc(doc(db, 'studios', studioDoc.id), {
            isClaimed: false,
          });

          await addDoc(collection(db, 'studioClaims'), {
            studioId: studioDoc.id,
            studioName: stData.name,
            userId: existingData.ownerId,
            userEmail: companyData.contactEmail.trim(),
            verificationMethod: 'website_url_update',
            documentFileName: `Website URL updated to ${newWebsite} - Admin Re-Verification Required`,
            status: 'pending',
            createdAt: Timestamp.now().toDate().toISOString(),
          });
        }
      }
    }
  },

  /** Delete a Company Brand doc & reassign its studios to Independent (companyId: null) */
  async deleteCompany(companyId: string): Promise<void> {
    // Reassign all associated studios to Independent status (companyId: null)
    const q = query(collection(db, 'studios'), where('companyId', '==', companyId));
    const studiosSnap = await getDocs(q);
    const reassignPromises = studiosSnap.docs.map((docSnap) =>
      updateDoc(doc(db, 'studios', docSnap.id), {
        companyId: null,
      })
    );
    await Promise.all(reassignPromises);

    const docRef = doc(db, 'companies', companyId);
    await deleteDoc(docRef);
  },

  /** Update studio parent company brand assignment (reassign or set Independent) */
  async updateStudioCompany(studioId: string, companyId: string | null): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    await updateDoc(studioRef, {
      companyId: companyId || null,
    });
  },

  /** Create a new Yoga Studio Location in Firestore */
  async createStudio(
    ownerId: string,
    studioData: {
      name: string;
      address: string;
      location_prefix: string;
      about?: string;
      companyId?: string;
      isClaimed?: boolean;
      userEmail?: string;
      contactEmail?: string;
      contactPhone?: string;
      websiteUrl?: string;
      coverImageUrl?: string;
      logoUrl?: string;
    }
  ): Promise<YogaStudio> {
    const studiosRef = collection(db, 'studios');
    const isVerified = studioData.isClaimed !== undefined ? studioData.isClaimed : false;

    const docData = {
      name: studioData.name.trim(),
      address: studioData.address.trim(),
      location_prefix: studioData.location_prefix.trim().toUpperCase(),
      about: studioData.about?.trim() || 'A welcoming studio space for practice.',
      companyId: studioData.companyId || null,
      ownerId,
      isClaimed: isVerified,
      contactEmail: studioData.contactEmail?.trim() || null,
      contactPhone: studioData.contactPhone?.trim() || null,
      websiteUrl: studioData.websiteUrl?.trim() || null,
      coverImageUrl: studioData.coverImageUrl?.trim() || null,
      logoUrl: studioData.logoUrl?.trim() || null,
      rating: 5.0,
      reviewCount: 0,
      engagementScore: 20,
      moderationSettings: {
        autoApproveMemberComments: true,
        guestCommentsEnabled: false,
      },
      location: {
        lat: 51.5074,
        lng: -0.1278,
      },
    };
    const newDocRef = await addDoc(studiosRef, docData);

    // If unverified, create a pending verification claim in /studioClaims for Admin approval
    if (!isVerified) {
      await addDoc(collection(db, 'studioClaims'), {
        studioId: newDocRef.id,
        studioName: docData.name,
        userId: ownerId,
        userEmail: studioData.userEmail || `${ownerId}@inspired.test`,
        verificationMethod: 'form_submission',
        documentFileName: 'studio_registration_proof.pdf',
        status: 'pending',
        createdAt: Timestamp.now().toDate().toISOString(),
      });
    }

    return {
      id: newDocRef.id,
      ...docData,
      companyId: docData.companyId || undefined,
    } as YogaStudio;
  },

  /** Update studio bio / about text (Verified Studio Owners Only) */
  async updateStudioBio(studioId: string, about: string): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    await updateDoc(studioRef, {
      about: about.trim(),
    });
  },

  /** Update studio operating status (active | temp_closed | closed) with optional statusNote */
  async updateStudioStatus(
    studioId: string,
    status: 'active' | 'temp_closed' | 'closed',
    statusNote?: string
  ): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    const isClosed = status === 'closed';
    await updateDoc(studioRef, {
      status,
      statusNote: statusNote?.trim() || null,
      isClosed,
      closedAt: isClosed ? Timestamp.now().toDate().toISOString() : null,
    });
  },

  /** Mark a studio location as closed (Soft deletion preserving subscribed user history) */
  async closeStudio(studioId: string): Promise<void> {
    await this.updateStudioStatus(studioId, 'closed');
  },

  /** Reopen a closed studio location */
  async reopenStudio(studioId: string): Promise<void> {
    await this.updateStudioStatus(studioId, 'active');
  },

  /** Delete a studio profile (performs soft deletion so subscribers still see closed status) */
  async deleteStudio(studioId: string): Promise<void> {
    await this.closeStudio(studioId);
  },

  /** Assign or unassign a studio location to a parent brand company */
  async assignStudioToCompany(studioId: string, companyId: string | null): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    await updateDoc(studioRef, { companyId: companyId || null });
  },

  /** Fetch all Studios owned/managed by a user (with auto-deduplication) */
  async fetchStudiosByOwner(ownerId: string): Promise<YogaStudio[]> {
    const q = query(collection(db, 'studios'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const studios = snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        name: d.name,
        address: d.address,
        about: d.about,
        rating: d.rating,
        isClaimed: d.isClaimed,
        status: d.status || (d.isClosed ? 'closed' : 'active'),
        statusNote: d.statusNote || undefined,
        isClosed: d.isClosed || d.status === 'closed' || false,
        closedAt: d.closedAt || undefined,
        ownerId: d.ownerId,
        companyId: d.companyId || undefined,
        parentBrandName: d.parentBrandName || undefined,
        parentBrandCommunityId: d.parentBrandCommunityId || undefined,
        membersCount: d.membersCount || 0,
        reviewCount: d.reviewCount,
        location_prefix: d.location_prefix,
        engagementScore: d.engagementScore,
        moderationSettings: d.moderationSettings,
        location: d.location,
        assignedTeachers: d.assignedTeachers || [],
      } as YogaStudio;
    });

    // Deduplicate studios by normalized name: prioritize verified (isClaimed: true), then first
    const groupedByName = new Map<string, YogaStudio[]>();
    studios.forEach((st) => {
      const key = st.name.toLowerCase().trim();
      const list = groupedByName.get(key) || [];
      list.push(st);
      groupedByName.set(key, list);
    });

    const deduplicatedStudios: YogaStudio[] = [];
    groupedByName.forEach((group) => {
      const verified = group.find((s) => s.isClaimed);
      if (verified) {
        deduplicatedStudios.push(verified);
      } else {
        deduplicatedStudios.push(group[0]);
      }
    });

    return deduplicatedStudios;
  },

  /** Fetch all Studios by location prefix or area */
  async fetchStudiosByLocation(_location: string): Promise<YogaStudio[]> {
    try {
      const q = query(collection(db, 'studios'));
      const snapshot = await getDocs(q);
      const studios = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          address: d.address,
          about: d.about,
          rating: d.rating,
          isClaimed: d.isClaimed,
          status: d.status || (d.isClosed ? 'closed' : 'active'),
          statusNote: d.statusNote || undefined,
          isClosed: d.isClosed || d.status === 'closed' || false,
          closedAt: d.closedAt || undefined,
          ownerId: d.ownerId,
          companyId: d.companyId || undefined,
          parentBrandName: d.parentBrandName || undefined,
          parentBrandCommunityId: d.parentBrandCommunityId || undefined,
          membersCount: d.membersCount || 0,
          reviewCount: d.reviewCount,
          location_prefix: d.location_prefix,
          engagementScore: d.engagementScore,
          moderationSettings: d.moderationSettings,
          location: d.location,
          assignedTeachers: d.assignedTeachers || [],
        } as YogaStudio;
      });

      return studios;
    } catch (e) {
      console.warn('[firestoreService] fetchStudiosByLocation failed:', e);
      return [];
    }
  },

  /** Fetch a single studio document by ID */
  async fetchStudioById(studioId: string): Promise<YogaStudio | null> {
    const rawId = studioId.replace('comm_studio_', '');
    try {
      const docRef = doc(db, 'studios', rawId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          address: d.address,
          about: d.about,
          rating: d.rating,
          isClaimed: d.isClaimed,
          status: d.status || (d.isClosed ? 'closed' : 'active'),
          statusNote: d.statusNote || undefined,
          isClosed: d.isClosed || d.status === 'closed' || false,
          closedAt: d.closedAt || undefined,
          ownerId: d.ownerId,
          companyId: d.companyId || undefined,
          parentBrandName: d.parentBrandName || undefined,
          parentBrandCommunityId: d.parentBrandCommunityId || undefined,
          membersCount: d.membersCount || 0,
          reviewCount: d.reviewCount,
          location_prefix: d.location_prefix,
          engagementScore: d.engagementScore,
          contactEmail: d.contactEmail,
          contactPhone: d.contactPhone,
          websiteUrl: d.websiteUrl,
          moderationSettings: d.moderationSettings,
          location: d.location,
          assignedTeachers: d.assignedTeachers || [],
        } as YogaStudio;
      }
    } catch (e) {
      console.warn('[firestoreService] fetchStudioById failed:', e);
    }
    return null;
  },

  /** Submit a claim request for a shadow profile studio */
  async submitStudioClaim(
    userId: string,
    userEmail: string,
    studioId: string,
    studioName: string,
    proofDocumentName?: string
  ): Promise<{ status: 'approved' | 'pending'; claimId: string }> {
    const claimsRef = collection(db, 'studioClaims');
    const claimData = {
      studioId,
      studioName,
      userId,
      userEmail,
      verificationMethod: proofDocumentName ? 'document' : 'domain_email',
      documentFileName: proofDocumentName || null,
      status: 'pending',
      createdAt: Timestamp.now().toDate().toISOString(),
    };

    const docRef = await addDoc(claimsRef, claimData);
    return {
      status: 'pending',
      claimId: docRef.id,
    };
  },

  /** Fetch all pending studio claim requests (Admin Only) */
  async fetchPendingClaims(): Promise<any[]> {
    const q = query(collection(db, 'studioClaims'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  },

  /** Approve a studio verification claim (Admin Only) */
  async approveStudioClaim(claimId: string, studioId: string, claimantUserId: string): Promise<void> {
    const claimRef = doc(db, 'studioClaims', claimId);
    await updateDoc(claimRef, {
      status: 'approved',
      reviewedAt: Timestamp.now().toDate().toISOString(),
    });

    const studioRef = doc(db, 'studios', studioId);
    await updateDoc(studioRef, {
      isClaimed: true,
      ownerId: claimantUserId,
    });

    // Auto-resolve any remaining duplicate pending claims for the same studio
    try {
      const q = query(
        collection(db, 'studioClaims'),
        where('studioId', '==', studioId),
        where('status', '==', 'pending')
      );
      const otherClaimsSnap = await getDocs(q);
      const autoResolvePromises = otherClaimsSnap.docs
        .filter((d) => d.id !== claimId)
        .map((d) =>
          updateDoc(doc(db, 'studioClaims', d.id), {
            status: 'rejected',
            rejectionReason: 'Auto-resolved: Another verification claim for this studio location was approved.',
            reviewedAt: Timestamp.now().toDate().toISOString(),
          })
        );
      await Promise.all(autoResolvePromises);

      // Clean up duplicate unverified studio documents created by the same user with the same name
      const studioSnap = await getDoc(studioRef);
      const studioData = studioSnap.data();
      if (studioData && studioData.name) {
        const dupStudiosQ = query(
          collection(db, 'studios'),
          where('ownerId', '==', claimantUserId),
          where('isClaimed', '==', false)
        );
        const dupStudiosSnap = await getDocs(dupStudiosQ);
        const dupDeletePromises = dupStudiosSnap.docs
          .filter((d) => d.id !== studioId && d.data().name === studioData.name)
          .map((d) => deleteDoc(doc(db, 'studios', d.id)));
        await Promise.all(dupDeletePromises);
      }
    } catch (err) {
      console.warn('[firestoreService] Failed to auto-resolve duplicate pending claims:', err);
    }
  },

  /** Reject a studio verification claim (Admin Only) */
  async rejectStudioClaim(claimId: string, rejectionReason?: string): Promise<void> {
    const claimRef = doc(db, 'studioClaims', claimId);
    await updateDoc(claimRef, {
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      reviewedAt: Timestamp.now().toDate().toISOString(),
    });
  },

  /** Hard delete a studio location document & auto-prune orphan company brand if 0 locations remain */
  async hardDeleteStudio(studioId: string): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    const studioSnap = await getDoc(studioRef);
    const companyId = studioSnap.exists() ? studioSnap.data()?.companyId : null;

    await deleteDoc(studioRef);

    if (companyId) {
      const q = query(collection(db, 'studios'), where('companyId', '==', companyId));
      const remainingSnap = await getDocs(q);
      if (remainingSnap.empty) {
        try {
          await deleteDoc(doc(db, 'companies', companyId));
        } catch (err) {
          console.warn('[firestoreService] Failed to auto-prune orphan company:', err);
        }
      }
    }
  },

  /** Fetch all studios in system (Admin Only) */
  async fetchAllStudios(): Promise<YogaStudio[]> {
    const q = query(collection(db, 'studios'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        name: d.name,
        address: d.address,
        about: d.about,
        rating: d.rating,
        isClaimed: d.isClaimed,
        status: d.status || (d.isClosed ? 'closed' : 'active'),
        statusNote: d.statusNote || undefined,
        isClosed: d.isClosed || d.status === 'closed' || false,
        closedAt: d.closedAt || undefined,
        ownerId: d.ownerId,
        companyId: d.companyId || undefined,
        parentBrandName: d.parentBrandName || undefined,
        parentBrandCommunityId: d.parentBrandCommunityId || undefined,
        membersCount: d.membersCount || 0,
        reviewCount: d.reviewCount,
        location_prefix: d.location_prefix,
        engagementScore: d.engagementScore,
        moderationSettings: d.moderationSettings,
        location: d.location,
        assignedTeachers: d.assignedTeachers || [],
      } as YogaStudio;
    });
  },

  /** Set studio verification status directly (Admin Only) */
  async setStudioClaimedStatus(studioId: string, isClaimed: boolean): Promise<void> {
    const studioRef = doc(db, 'studios', studioId);
    await updateDoc(studioRef, {
      isClaimed,
    });
  },

  /** Check if an email address is invited in staging */
  async checkStagingInvite(email: string): Promise<boolean> {
    const q = query(
      collection(db, 'stagingInvites'),
      where('email', '==', email.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  /** Create a new staging invitation (Admin Only) */
  async createStagingInvite(email: string, invitedBy: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const q = query(
      collection(db, 'stagingInvites'),
      where('email', '==', cleanEmail)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return; // Already invited
    }
    await addDoc(collection(db, 'stagingInvites'), {
      email: cleanEmail,
      invitedBy,
      status: 'pending',
      createdAt: Timestamp.now().toDate().toISOString(),
    });
  },

  /** Fetch all staging invitations (Admin Only) */
  async fetchStagingInvites(): Promise<StagingInvite[]> {
    const snap = await getDocs(collection(db, 'stagingInvites'));
    const invitesMap = new Map<string, StagingInvite>();
    snap.docs.forEach((d) => {
      const data = d.data();
      const cleanEmail = data.email?.trim().toLowerCase();
      if (cleanEmail && !invitesMap.has(cleanEmail)) {
        invitesMap.set(cleanEmail, {
          id: d.id,
          email: cleanEmail,
          status: data.status || 'sent',
          errorReason: data.errorReason || undefined,
          invitedBy: data.invitedBy,
          createdAt: data.createdAt || new Date().toISOString(),
          sentAt: data.sentAt || undefined,
          failedAt: data.failedAt || undefined,
        });
      }
    });
    return Array.from(invitesMap.values());
  },

  /** Retry a failed staging invitation by setting status back to pending */
  async retryStagingInvite(inviteId: string): Promise<void> {
    const inviteRef = doc(db, 'stagingInvites', inviteId);
    await updateDoc(inviteRef, {
      status: 'pending',
      errorReason: null,
      createdAt: Timestamp.now().toDate().toISOString(),
    });
  },

  /** Delete/Revoke a staging invitation (Admin Only) */
  async deleteStagingInvite(inviteId: string): Promise<void> {
    await deleteDoc(doc(db, 'stagingInvites', inviteId));
  },

  /** Fetch classes scheduled for a studio on a given date string (or all classes if omitted) */
  async fetchStudioClasses(studioId: string, dateString?: string): Promise<StudioClass[]> {
    try {
      const classesRef = collection(db, 'studios', studioId, 'classes');
      const q = dateString ? query(classesRef, where('dateString', '==', dateString)) : query(classesRef);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudioClass));
    } catch (e) {
      console.warn(`Firestore class fetch error for studio ${studioId}:`, e);
      return [];
    }
  },

  /** Book or waitlist a studio class */
  async bookStudioClass(
    studioId: string, 
    classId: string, 
    user: UserProfile
  ): Promise<{ status: 'confirmed' | 'waitlisted'; position?: number }> {
    const bookingRef = doc(db, 'studios', studioId, 'classes', classId, 'bookings', user.id);
    const classRef = doc(db, 'studios', studioId, 'classes', classId);

    const classSnap = await getDoc(classRef);
    let currentBooked = 10;
    let currentCapacity = 24;
    let currentWaitlist: string[] = [];

    if (classSnap.exists()) {
      const data = classSnap.data() as StudioClass;
      currentBooked = data.bookedCount;
      currentCapacity = data.capacity;
      currentWaitlist = data.waitlist || [];
    }

    if (currentBooked < currentCapacity) {
      await setDoc(bookingRef, {
        id: user.id,
        classId,
        studioId,
        userId: user.id,
        userDisplayName: user.displayName,
        bookedAt: new Date().toISOString(),
        status: 'confirmed',
      } as ClassBooking);

      await updateDoc(classRef, {
        bookedCount: currentBooked + 1,
      }).catch(() => {});

      return { status: 'confirmed' };
    } else {
      const newWaitlist = [...currentWaitlist, user.id];
      const position = newWaitlist.length;

      await setDoc(bookingRef, {
        id: user.id,
        classId,
        studioId,
        userId: user.id,
        userDisplayName: user.displayName,
        bookedAt: new Date().toISOString(),
        status: 'waitlisted',
        waitlistPosition: position,
      } as ClassBooking);

      await updateDoc(classRef, {
        waitlist: newWaitlist,
      }).catch(() => {});

      return { status: 'waitlisted', position };
    }
  },

  /** Cancel a studio class booking */
  async cancelStudioBooking(studioId: string, classId: string, userId: string): Promise<void> {
    const bookingRef = doc(db, 'studios', studioId, 'classes', classId, 'bookings', userId);
    await deleteDoc(bookingRef).catch(() => {});

    const classRef = doc(db, 'studios', studioId, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (classSnap.exists()) {
      const data = classSnap.data() as StudioClass;
      const currentBooked = Math.max(0, data.bookedCount - 1);
      await updateDoc(classRef, { bookedCount: currentBooked }).catch(() => {});
    }
  },

  /** Fetch enrolled members for a studio */
  async fetchStudioMembers(studioId: string): Promise<StudioMember[]> {
    try {
      const q = query(collection(db, 'studios', studioId, 'members'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudioMember));
    } catch (e) {
      console.warn(`Firestore studio members query error for ${studioId}:`, e);
      return [];
    }
  },

  /** Cascading Join: Joins Studio Branch Community AND Parent Brand Community in a single action */
  async joinStudioWithParentBrand(
    studioId: string, 
    parentBrandCommunityId: string | undefined, 
    user: UserProfile
  ): Promise<UserProfile> {
    const studioCommunityId = `comm_studio_${studioId}`;
    const communitiesToJoin = new Set(user.joinedCommunities || []);
    
    communitiesToJoin.add(studioId);
    communitiesToJoin.add(studioCommunityId);
    if (parentBrandCommunityId) {
      communitiesToJoin.add(parentBrandCommunityId);
    }

    const updatedCommunities = Array.from(communitiesToJoin);
    const userRef = doc(db, 'users', user.id);
    
    await setDoc(userRef, {
      joinedCommunities: updatedCommunities,
    }, { merge: true });

    // Register user in studio members collection
    const memberRef = doc(db, 'studios', studioId, 'members', user.id);
    await setDoc(memberRef, {
      id: user.id,
      displayName: user.displayName,
      isProfilePublic: user.isProfilePublic ?? true,
      joinedAt: new Date().toISOString(),
    } as StudioMember).catch(() => {});

    return {
      ...user,
      joinedCommunities: updatedCommunities,
    };
  },

  // --- Section 5.20: Brand Currency Catalog, Studio Acceptance Policies & User Pass Wallet ---

  /** Create a new Company / Brand Currency or Studio Custom Override */
  async createCompanyCurrency(input: Omit<CompanyCurrency, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyCurrency> {
    const now = new Date().toISOString();
    const currencyRef = doc(collection(db, 'company_currencies'));
    const currencyData: CompanyCurrency = {
      ...input,
      id: currencyRef.id,
      createdAt: now,
      updatedAt: now,
    };
    const cleanedData = Object.fromEntries(
      Object.entries(currencyData).filter(([, val]) => val !== undefined)
    );
    await setDoc(currencyRef, cleanedData);
    return currencyData;
  },

  /** Fetch all currencies for a parent company brand, aggregating studio custom overrides */
  async fetchCompanyCurrencies(companyId: string): Promise<CompanyCurrency[]> {
    if (!companyId) return [];
    try {
      const q = query(
        collection(db, 'company_currencies'),
        where('companyId', '==', companyId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => docSnap.data() as CompanyCurrency);
    } catch {
      return [];
    }
  },

  /** Update an existing currency definition */
  async updateCompanyCurrency(id: string, updates: Partial<CompanyCurrency>): Promise<void> {
    const currencyRef = doc(db, 'company_currencies', id);
    await updateDoc(currencyRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /** Fetch studio branch currency acceptance policy */
  async fetchStudioCurrencyPolicy(studioId: string): Promise<StudioCurrencyPolicy | null> {
    if (!studioId) return null;
    try {
      const policyRef = doc(db, 'studio_currency_policies', studioId);
      const snap = await getDoc(policyRef);
      if (snap.exists()) {
        return snap.data() as StudioCurrencyPolicy;
      }
      return null;
    } catch {
      return null;
    }
  },

  /** Save or update studio branch currency acceptance policy */
  async saveStudioCurrencyPolicy(policy: StudioCurrencyPolicy): Promise<void> {
    const policyRef = doc(db, 'studio_currency_policies', policy.studioId);
    await setDoc(policyRef, {
      ...policy,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  /** Grant a pass/credit to a user (Admin POS / Staging / Dev execution) */
  async grantUserPass(input: Omit<UserPass, 'id' | 'purchasedAt' | 'expiresAt' | 'status'>): Promise<UserPass> {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + (input.validityDays || 30));

    const passRef = doc(collection(db, 'user_passes'));
    const passData: UserPass = {
      ...input,
      id: passRef.id,
      purchasedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'active',
      creditsRemaining: input.tierType === 'unlimited' ? undefined : (input.creditsRemaining ?? input.totalCredits ?? 1),
    };
    await setDoc(passRef, passData);
    return passData;
  },

  /** Fetch user pass wallet for a user */
  async fetchUserPasses(userId: string): Promise<UserPass[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'user_passes'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const now = new Date();
      return snapshot.docs.map((docSnap) => {
        const pass = docSnap.data() as UserPass;
        // Check for expiration
        if (pass.status === 'active' && new Date(pass.expiresAt) < now) {
          return { ...pass, status: 'expired' as const };
        }
        return pass;
      });
    } catch {
      return [];
    }
  },

  /** Book class with selected pass redemption */
  async bookClassWithPass(
    classId: string, 
    studioId: string, 
    userId: string, 
    userDisplayName: string, 
    passId?: string
  ): Promise<{ bookingId: string; status: 'confirmed' | 'waitlisted' }> {
    const classRef = doc(db, 'studio_classes', classId);
    const classSnap = await getDoc(classRef);
    if (!classSnap.exists()) {
      throw new Error(`Class not found: ${classId}`);
    }
    const classData = classSnap.data() as StudioClass;
    const isWaitlisted = classData.bookedCount >= classData.capacity;
    const bookingStatus = isWaitlisted ? 'waitlisted' : 'confirmed';

    let creditsRedeemed = 0;
    if (passId && !isWaitlisted) {
      const passRef = doc(db, 'user_passes', passId);
      const passSnap = await getDoc(passRef);
      if (passSnap.exists()) {
        const passData = passSnap.data() as UserPass;
        if (passData.tierType !== 'unlimited' && passData.creditsRemaining && passData.creditsRemaining > 0) {
          creditsRedeemed = 1;
          const newCredits = passData.creditsRemaining - 1;
          await updateDoc(passRef, {
            creditsRemaining: newCredits,
            status: newCredits === 0 ? 'exhausted' : 'active',
          });
        }
      }
    }

    const bookingRef = doc(collection(db, 'class_bookings'));
    const now = new Date().toISOString();
    const bookingData: ClassBooking = {
      id: bookingRef.id,
      classId,
      studioId,
      userId,
      userDisplayName,
      bookedAt: now,
      status: bookingStatus,
      passIdUsed: passId,
      creditsRedeemed,
    };
    await setDoc(bookingRef, bookingData);

    // Update class bookedCount
    if (!isWaitlisted) {
      await updateDoc(classRef, {
        bookedCount: classData.bookedCount + 1,
      });
    } else {
      const waitlist = classData.waitlist || [];
      await updateDoc(classRef, {
        waitlist: [...waitlist, userId],
      });
    }

    return { bookingId: bookingRef.id, status: bookingStatus };
  },

  /** Cancel booking with transaction reversal refund (credits restored if >= 12h prior) */
  async cancelClassBooking(
    bookingId: string, 
    classId: string, 
    userId: string, 
    classDateISO: string
  ): Promise<{ refunded: boolean; creditsRestored?: number }> {
    const bookingRef = doc(db, 'class_bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    let creditsRestored = 0;
    let refunded = false;

    if (bookingSnap.exists()) {
      const booking = bookingSnap.data() as ClassBooking;
      if (booking.userId && booking.userId !== userId) {
        throw new Error('Unauthorized cancellation attempt');
      }
      
      // Calculate 12-hour deadline check
      const now = new Date();
      const classDate = new Date(classDateISO);
      const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilClass >= 12 && booking.passIdUsed && booking.creditsRedeemed && booking.creditsRedeemed > 0) {
        const passRef = doc(db, 'user_passes', booking.passIdUsed);
        const passSnap = await getDoc(passRef);
        if (passSnap.exists()) {
          const passData = passSnap.data() as UserPass;
          creditsRestored = booking.creditsRedeemed;
          const restoredCredits = (passData.creditsRemaining || 0) + creditsRestored;
          await updateDoc(passRef, {
            creditsRemaining: restoredCredits,
            status: 'active',
          });
          refunded = true;
        }
      }

      await deleteDoc(bookingRef);

      // Decrement class bookedCount
      const classRef = doc(db, 'studio_classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const classData = classSnap.data() as StudioClass;
        if (booking.status === 'confirmed' && classData.bookedCount > 0) {
          await updateDoc(classRef, {
            bookedCount: classData.bookedCount - 1,
          });
        }
      }
    }

    return { refunded, creditsRestored };
  },
};
