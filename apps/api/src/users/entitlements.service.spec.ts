import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    resume: {
      count: jest.fn(),
    },
  };

  const service = new EntitlementsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks free users over resume limit', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    prisma.resume.count.mockResolvedValue(1);

    const result = await service.can('u1', 'createResume');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Free plan/i);
  });

  it('allows pro users to run matches', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'PRO',
      matchesUsedMonth: 50,
      matchMonthKey: service.monthKey(),
    });

    const result = await service.can('u1', 'runMatch');
    expect(result.allowed).toBe(true);
  });

  it('allows free export after entitlement update', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    const result = await service.can('u1', 'export');
    expect(result.allowed).toBe(true);
  });

  it('blocks free users at match limit', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 2,
      matchMonthKey: service.monthKey(),
    });
    const result = await service.can('u1', 'runMatch');
    expect(result.allowed).toBe(false);
  });

  it('resets match count on new month key', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 99,
      matchMonthKey: '1999-01',
    });
    const result = await service.can('u1', 'runMatch');
    expect(result.allowed).toBe(true);
  });

  it('gates coaching and rich feedback', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    expect((await service.can('u1', 'coaching')).allowed).toBe(false);
    expect((await service.can('u1', 'richFeedback')).allowed).toBe(false);
  });

  it('consumes a match usage slot', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'u1',
      matchesUsedMonth: 1,
      matchMonthKey: service.monthKey(),
    });
    await service.consumeMatch('u1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ matchesUsedMonth: 2 }),
      }),
    );
  });
});
