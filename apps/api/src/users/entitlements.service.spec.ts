import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
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
});
