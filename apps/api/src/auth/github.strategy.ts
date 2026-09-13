import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'unused',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'unused',
      callbackURL: `${process.env.API_ORIGIN ?? 'http://localhost:4000'}/api/v1/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const email =
      profile.emails?.[0]?.value ?? `${profile.username}@users.noreply.github.com`;
    done(null, {
      provider: 'GITHUB' as const,
      providerId: profile.id,
      email,
      name: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value,
    });
  }
}
