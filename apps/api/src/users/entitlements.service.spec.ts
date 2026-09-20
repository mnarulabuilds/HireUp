import { NotFoundException } from '@nestjs/common';
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

  it('throws when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.can('missing', 'export')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects unknown feature keys', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'PRO',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    const result = await service.can('u1', 'unknownFeature' as never);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Unknown feature/i);
  });

  it('allows pro plan premium features without upgrade reasons', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'PRO',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });

    expect((await service.can('u1', 'richFeedback')).allowed).toBe(true);
    expect((await service.can('u1', 'export')).allowed).toBe(true);
    expect((await service.can('u1', 'richFeedback')).reason).toBeUndefined();

    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'COACH',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    expect((await service.can('u1', 'coaching')).allowed).toBe(true);
  });

  it('allows create when under resume limit', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      plan: 'FREE',
      matchesUsedMonth: 0,
      matchMonthKey: service.monthKey(),
    });
    prisma.resume.count.mockResolvedValue(0);
    const result = await service.can('u1', 'createResume');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
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

  it('resets usage when consuming in a new month', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'u1',
      matchesUsedMonth: 9,
      matchMonthKey: '1999-01',
    });
    await service.consumeMatch('u1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ matchesUsedMonth: 1 }),
      }),
    );
  });
});
