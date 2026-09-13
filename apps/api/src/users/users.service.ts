import { Injectable, NotFoundException } from '@nestjs/common';
import { ENTITLEMENTS, PlanTier } from '@hireup/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = user.plan as PlanTier;
    const key = this.entitlements.monthKey();
    const matchesUsed =
      user.matchMonthKey === key ? user.matchesUsedMonth : 0;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      plan,
      limits: ENTITLEMENTS[plan],
      usage: {
        matchesUsedMonth: matchesUsed,
        matchMonthKey: key,
      },
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
    };
  }
}
