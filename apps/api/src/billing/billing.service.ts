import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  private requireStripe() {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Billing unavailable — configure STRIPE_SECRET_KEY',
      );
    }
    return this.stripe;
  }

  status() {
    return {
      available: Boolean(this.stripe),
      donationLink: process.env.STRIPE_DONATION_PAYMENT_LINK || null,
      prices: {
        pro: process.env.STRIPE_PRICE_PRO || null,
        coach: process.env.STRIPE_PRICE_COACH || null,
      },
    };
  }

  async ensureCustomer(userId: string) {
    const stripe = this.requireStripe();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  async createCheckout(userId: string, plan: 'PRO' | 'COACH') {
    const stripe = this.requireStripe();
    const price =
      plan === 'PRO'
        ? process.env.STRIPE_PRICE_PRO
        : process.env.STRIPE_PRICE_COACH;
    if (!price) {
      throw new ServiceUnavailableException(`Missing Stripe price for ${plan}`);
    }

    const customerId = await this.ensureCustomer(userId);
    const mode = plan === 'PRO' ? 'subscription' : 'payment';
    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.WEB_ORIGIN}/settings/billing?success=1`,
      cancel_url: `${process.env.WEB_ORIGIN}/settings/billing?canceled=1`,
      metadata: { userId, plan },
    });
    return { url: session.url };
  }

  async createPortal(userId: string) {
    const stripe = this.requireStripe();
    const customerId = await this.ensureCustomer(userId);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.WEB_ORIGIN}/settings/billing`,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.requireStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Missing STRIPE_WEBHOOK_SECRET');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as PlanTier | undefined;
        if (userId && plan) {
          await this.applyPlan(userId, plan, session.subscription as string | null);
          if (plan === 'COACH' && session.payment_intent) {
            await this.prisma.coachingSession.updateMany({
              where: { userId, paid: false },
              data: {
                paid: true,
                stripePaymentId: String(session.payment_intent),
              },
            });
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = String(sub.customer);
        const user = await this.prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (user) {
          const active = sub.status === 'active' || sub.status === 'trialing';
          await this.prisma.user.update({
            where: { id: user.id },
            data: { plan: active ? 'PRO' : 'FREE' },
          });
          await this.prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              stripeSubscriptionId: sub.id,
              plan: active ? 'PRO' : 'FREE',
              status: this.mapStatus(sub.status),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: sub.id,
              plan: active ? 'PRO' : 'FREE',
              status: this.mapStatus(sub.status),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  private async applyPlan(
    userId: string,
    plan: PlanTier,
    stripeSubscriptionId: string | null,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
      },
      update: {
        plan,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
      },
    });
  }

  private mapStatus(status: Stripe.Subscription.Status) {
    switch (status) {
      case 'active':
        return 'ACTIVE' as const;
      case 'canceled':
        return 'CANCELED' as const;
      case 'past_due':
        return 'PAST_DUE' as const;
      case 'incomplete':
        return 'INCOMPLETE' as const;
      case 'trialing':
        return 'TRIALING' as const;
      default:
        return 'CANCELED' as const;
    }
  }
}
