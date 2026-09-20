import { ENTITLEMENTS, FeatureKey, PlanTier } from '@hireup/shared';

export type EntitlementUser = {
  matchesUsedMonth: number;
  matchMonthKey: string | null;
};

export type EntitlementGateContext = {
  userId: string;
  user: EntitlementUser;
  plan: PlanTier;
  limits: (typeof ENTITLEMENTS)[PlanTier];
  monthKey: string;
  resumeCount?: number;
};

export type EntitlementGateResult = {
  allowed: boolean;
  reason?: string;
  plan: PlanTier;
};

export type EntitlementFeatureGate = {
  feature: FeatureKey;
  evaluate: (ctx: EntitlementGateContext) => EntitlementGateResult | Promise<EntitlementGateResult>;
};

function planResult(
  ctx: EntitlementGateContext,
  allowed: boolean,
  reason?: string,
): EntitlementGateResult {
  return { allowed, plan: ctx.plan, reason };
}

export const ENTITLEMENT_FEATURE_GATES: EntitlementFeatureGate[] = [
  {
    feature: 'richFeedback',
    evaluate: (ctx) =>
      planResult(
        ctx,
        ctx.limits.richFeedback,
        ctx.limits.richFeedback ? undefined : 'Upgrade to Pro for richer feedback',
      ),
  },
  {
    feature: 'export',
    evaluate: (ctx) =>
      planResult(
        ctx,
        ctx.limits.exportEnabled,
        ctx.limits.exportEnabled ? undefined : 'Export requires Pro',
      ),
  },
  {
    feature: 'coaching',
    evaluate: (ctx) =>
      planResult(
        ctx,
        ctx.limits.coachingIncluded,
        ctx.limits.coachingIncluded
          ? undefined
          : 'Purchase Coach to unlock interview prep',
      ),
  },
  {
    feature: 'createResume',
    evaluate: (ctx) => {
      const count = ctx.resumeCount ?? 0;
      const allowed = count < ctx.limits.maxResumes;
      return planResult(
        ctx,
        allowed,
        allowed ? undefined : `Free plan allows ${ctx.limits.maxResumes} resume(s)`,
      );
    },
  },
  {
    feature: 'runMatch',
    evaluate: (ctx) => {
      const used =
        ctx.user.matchMonthKey == null || ctx.user.matchMonthKey !== ctx.monthKey
          ? 0
          : ctx.user.matchesUsedMonth;
      const allowed = used < ctx.limits.maxMatchesPerMonth;
      return planResult(
        ctx,
        allowed,
        allowed
          ? undefined
          : `Free plan allows ${ctx.limits.maxMatchesPerMonth} matches per month`,
      );
    },
  },
];

export const ENTITLEMENT_GATE_BY_FEATURE = new Map<FeatureKey, EntitlementFeatureGate>(
  ENTITLEMENT_FEATURE_GATES.map((gate) => [gate.feature, gate]),
);
