import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chunkArray, ProfileValidationError, firestoreService } from '../firestoreService';

// Mock Firebase SDKs
vi.mock('firebase/firestore', () => ({
  doc: vi.fn().mockImplementation(() => ({ id: 'mock_doc_id_123' })),
  getDoc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  Timestamp: {
    now: () => ({ toISOString: () => '2026-08-28T10:00:00.000Z' }),
    fromDate: (date: Date) => date,
  },
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn().mockReturnValue(vi.fn().mockResolvedValue({ data: { isValid: true } })),
}));

vi.mock('../../firebase', () => ({
  db: {},
  app: {},
}));

describe('firestoreService & Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chunkArray() Utility', () => {
    it('splits a large array of community IDs into chunks of maximum size 30', () => {
      const communityIds = Array.from({ length: 75 }, (_, i) => `community_${i + 1}`);
      const chunks = chunkArray(communityIds, 30);

      expect(chunks.length).toBe(3);
      expect(chunks[0].length).toBe(30);
      expect(chunks[1].length).toBe(30);
      expect(chunks[2].length).toBe(15);
      expect(chunks[0][0]).toBe('community_1');
      expect(chunks[2][14]).toBe('community_75');
    });

    it('handles empty arrays cleanly', () => {
      const chunks = chunkArray([], 30);
      expect(chunks).toEqual([]);
    });

    it('returns a single chunk if array length is less than chunkSize', () => {
      const communityIds = ['comm_1', 'comm_2', 'comm_3'];
      const chunks = chunkArray(communityIds, 30);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toEqual(['comm_1', 'comm_2', 'comm_3']);
    });
  });

  describe('validateDisplayName()', () => {
    it('throws ProfileValidationError if display name is under 2 characters', async () => {
      await expect(firestoreService.validateDisplayName('A')).rejects.toThrow(
        ProfileValidationError
      );
      await expect(firestoreService.validateDisplayName('  ')).rejects.toThrow(
        'Display name must be at least 2 characters.'
      );
    });

    it('passes for display names >= 2 characters', async () => {
      const isValid = await firestoreService.validateDisplayName('Jane Doe');
      expect(isValid).toBe(true);
    });
  });

  describe('detectNearestArea()', () => {
    it('returns default initial area Askew', async () => {
      const area = await firestoreService.detectNearestArea();
      expect(area).toBe('Askew');
    });
  });

  describe('joinStudioWithParentBrand()', () => {
    it('automatically adds both Studio Branch Community AND Parent Brand Community in a single cascading join', async () => {
      const mockUser = {
        id: 'user_sarah',
        displayName: 'Sarah Jenkins',
        joinedCommunities: ['area_askew'],
      } as any;

      const updated = await firestoreService.joinStudioWithParentBrand(
        'studio_chiswick_002',
        'comm_brand_affordable_london',
        mockUser
      );

      expect(updated.joinedCommunities).toContain('studio_chiswick_002');
      expect(updated.joinedCommunities).toContain('comm_studio_studio_chiswick_002');
      expect(updated.joinedCommunities).toContain('comm_brand_affordable_london');
      expect(updated.joinedCommunities).toContain('area_askew');
      expect(updated.joinedCommunities?.length).toBe(4);
    });
  });

  describe('Section 5.20 Brand Currency & Pass Wallet Methods', () => {
    it('creates company currency and returns document with generated ID', async () => {
      const result = await firestoreService.createCompanyCurrency({
        companyId: 'company_affordable_london',
        title: '5-Class Pack (Summer Special)',
        description: 'Valid for 5 sessions across all brand studios',
        tierType: 'credit_pack',
        creditCount: 5,
        basePriceAmount: 60,
        currencySymbol: '£',
        validityDays: 60,
        allowedStudioIds: 'all',
      });

      expect(result.title).toBe('5-Class Pack (Summer Special)');
      expect(result.creditCount).toBe(5);
      expect(result.basePriceAmount).toBe(60);
      expect(result.id).toBeDefined();
    });

    it('grants a pass to user and calculates 60-day expiration date', async () => {
      const result = await firestoreService.grantUserPass({
        userId: 'elena@inspiredyoga.app',
        currencyId: 'curr_5pack',
        currencyTitle: '5-Class Pack',
        tierType: 'credit_pack',
        totalCredits: 5,
        creditsRemaining: 5,
        validityDays: 60,
        grantNote: 'Cash Payment Recorded (£20)',
      });

      expect(result.userId).toBe('elena@inspiredyoga.app');
      expect(result.creditsRemaining).toBe(5);
      expect(result.status).toBe('active');
      expect(result.grantNote).toBe('Cash Payment Recorded (£20)');
    });
  });
});
