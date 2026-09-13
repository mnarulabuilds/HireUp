import { Injectable, NotFoundException } from '@nestjs/common';
import { ENTITLEMENTS, FeatureKey, PlanTier } from '@hireup/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  getLimits(plan: PlanTier) {
    return ENTITLEMENTS[plan];
  }

  monthKey(date = new Date()) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async can(
    userId: string,
    feature: FeatureKey,
  ): Promise<{ allowed: boolean; reason?: string; plan: PlanTier }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = user.plan as PlanTier;
    const limits = this.getLimits(plan);

    if (feature === 'richFeedback') {
      return { allowed: limits.richFeedback, plan, reason: limits.richFeedback ? undefined : 'Upgrade to Pro for richer feedback' };
    }
    if (feature === 'export') {
      return { allowed: limits.exportEnabled, plan, reason: limits.exportEnabled ? undefined : 'Export requires Pro' };
    }
    if (feature === 'coaching') {
      return {
        allowed: limits.coachingIncluded,
        plan,
        reason: limits.coachingIncluded ? undefined : 'Purchase Coach to unlock interview prep',
      };
    }

    if (feature === 'createResume') {
      const count = await this.prisma.resume.count({ where: { userId } });
      const allowed = count < limits.maxResumes;
      return {
        allowed,
        plan,
        reason: allowed ? undefined : `Free plan allows ${limits.maxResumes} resume(s)`,
      };
    }

    if (feature === 'runMatch') {
      const key = this.monthKey();
      let used = user.matchesUsedMonth;
      if (user.matchMonthKey !== key) {
        used = 0;
      }
      const allowed = used < limits.maxMatchesPerMonth;
      return {
        allowed,
        plan,
        reason: allowed
          ? undefined
          : `Free plan allows ${limits.maxMatchesPerMonth} matches per month`,
      };
    }

    return { allowed: false, plan, reason: 'Unknown feature' };
  }

  async consumeMatch(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const key = this.monthKey();
    const used = user.matchMonthKey === key ? user.matchesUsedMonth : 0;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        matchMonthKey: key,
        matchesUsedMonth: used + 1,
      },
    });
  }
}
