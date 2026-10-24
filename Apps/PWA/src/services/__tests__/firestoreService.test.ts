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
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
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

  describe('Section 5.16 Class Schedule Creator & Recurrence Engine', () => {
    it('publishes a single session correctly when frequency is none', async () => {
      const classes = await firestoreService.publishStudioClass({
        studioId: 'studio_chiswick_01',
        className: 'Power Flow',
        classTypeDescription: 'Dynamic strong flow in heated studio',
        dateString: '2026-10-26',
        startTime: '08:00 AM',
        endTime: '09:00 AM',
        capacity: 20,
        roomClimate: 'hot_studio',
        teacherId: 'teacher_elena',
        teacherName: 'Elena Rostova',
        recurrence: { frequency: 'none', endCondition: 'never' },
      });

      expect(classes.length).toBe(1);
      expect(classes[0].dateString).toBe('2026-10-26');
      expect(classes[0].status).toBe('published');
    });

    it('generates multi-week recurrence without being truncated by a 12-session cap when endCondition is date', async () => {
      // 16 weeks of Mondays: from 2026-01-05 to 2026-04-20
      const classes = await firestoreService.publishStudioClass({
        studioId: 'studio_chiswick_01',
        className: 'Monday Ashtanga',
        classTypeDescription: 'Traditional 90m primary series',
        dateString: '2026-01-05',
        startTime: '07:00 AM',
        endTime: '08:30 AM',
        capacity: 20,
        roomClimate: 'hot_studio',
        teacherId: 'teacher_elena',
        teacherName: 'Elena Rostova',
        recurrence: {
          frequency: 'weekly',
          daysOfWeek: ['Mon'],
          endCondition: 'date',
          endDate: '2026-04-20',
        },
      });

      expect(classes.length).toBe(16);
      expect(classes[0].dateString).toBe('2026-01-05');
      expect(classes[classes.length - 1].dateString).toBe('2026-04-20');
    });

    it('returns empty array when end date is before start date', async () => {
      const classes = await firestoreService.publishStudioClass({
        studioId: 'studio_chiswick_01',
        className: 'Invalid Date Series',
        classTypeDescription: 'Invalid series with inverted dates',
        dateString: '2026-06-01',
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        capacity: 15,
        roomClimate: 'natural_ambient',
        teacherId: 'teacher_david',
        teacherName: 'David Kim',
        recurrence: {
          frequency: 'weekly',
          daysOfWeek: ['Mon'],
          endCondition: 'date',
          endDate: '2026-05-01', // cutoff is in the past
        },
      });

      expect(classes).toEqual([]);
    });

    it('enforces server-side pass currency validation when currencyAcceptancePolicyMode is customSelected', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      // Mock class requiring curr_pack_vip
      (getDoc as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'class_vip_01',
            studioId: 'studio_chiswick_01',
            capacity: 20,
            bookedCount: 5,
            currencyAcceptancePolicyMode: 'customSelected',
            acceptedCurrencyIds: ['curr_pack_vip'],
          }),
        })
        .mockResolvedValueOnce({
          // Mock user pass with standard currency
          exists: () => true,
          data: () => ({
            id: 'pass_standard_01',
            currencyId: 'curr_standard',
            tierType: 'credit_pack',
            creditsRemaining: 3,
          }),
        });

      await expect(
        firestoreService.bookClassWithPass(
          'class_vip_01',
          'studio_chiswick_01',
          'user_sarah',
          'Sarah Jenkins',
          'pass_standard_01'
        )
      ).rejects.toThrow('This pass is not accepted for this studio class.');
    });

    it('filters out draft classes in fetchStudioClasses', async () => {
      const { getDocs } = await import('firebase/firestore');
      (getDocs as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        docs: [
          { id: 'cls_published_1', data: () => ({ className: 'Flow 1', status: 'published' }) },
          { id: 'cls_draft_1', data: () => ({ className: 'Draft Flow', status: 'draft' }) },
          { id: 'cls_legacy_1', data: () => ({ className: 'Legacy Flow' }) },
        ],
      });

      const classes = await firestoreService.fetchStudioClasses('studio_chiswick_01');
      expect(classes.length).toBe(2);
      expect(classes.map(c => c.id)).toEqual(['cls_published_1', 'cls_legacy_1']);
    });
  });
});
