import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, User } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export type OAuthProfile = {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async upsertOAuthUser(profile: OAuthProfile): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: profile.email,
          name: profile.name ?? existing.name,
          avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
        },
      });
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          provider: profile.provider,
          providerId: profile.providerId,
          name: profile.name ?? byEmail.name,
          avatarUrl: profile.avatarUrl ?? byEmail.avatarUrl,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        provider: profile.provider,
        providerId: profile.providerId,
        subscription: {
          create: { plan: 'FREE', status: 'ACTIVE' },
        },
      },
    });
  }

  async issueSession(user: User, res: Response) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
        expiresIn: 60 * 15,
      },
    );

    const refreshRaw = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshRaw);
    const ttlDays = 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieBase = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProd,
      path: '/',
    };

    res.cookie('hireup_access', accessToken, {
      ...cookieBase,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('hireup_refresh', refreshRaw, {
      ...cookieBase,
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  async refresh(refreshRaw: string, res: Response) {
    const tokenHash = this.hashToken(refreshRaw);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueSession(stored.user, res);
  }

  async logout(refreshRaw: string | undefined, res: Response) {
    if (refreshRaw) {
      const tokenHash = this.hashToken(refreshRaw);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    res.clearCookie('hireup_access', { path: '/' });
    res.clearCookie('hireup_refresh', { path: '/' });
  }

  hashToken(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }
}
