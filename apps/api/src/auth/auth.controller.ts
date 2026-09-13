import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService, OAuthProfile } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Get('providers')
  providers() {
    return {
      google: Boolean(process.env.GOOGLE_CLIENT_ID),
      github: Boolean(process.env.GITHUB_CLIENT_ID),
      dev: process.env.NODE_ENV !== 'production',
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.auth.upsertOAuthUser(req.user as OAuthProfile);
    await this.auth.issueSession(user, res);
    return res.redirect(`${process.env.WEB_ORIGIN}/dashboard`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    return;
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.auth.upsertOAuthUser(req.user as OAuthProfile);
    await this.auth.issueSession(user, res);
    return res.redirect(`${process.env.WEB_ORIGIN}/dashboard`);
  }

  @Post('dev-login')
  async devLogin(
    @Body() body: { email?: string; name?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException('Dev login disabled');
    }
    const email = body.email ?? 'dev@hireup.local';
    const user = await this.auth.upsertOAuthUser({
      provider: 'DEV',
      providerId: `dev:${email}`,
      email,
      name: body.name ?? 'HireUp Dev',
    });
    await this.auth.issueSession(user, res);
    return { ok: true, user: await this.users.getPublicProfile(user.id) };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh = req.cookies?.hireup_refresh as string | undefined;
    if (!refresh) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const result = await this.auth.refresh(refresh, res);
    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return { ok: true };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.hireup_refresh, res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.users.getPublicProfile(user.userId);
  }
}
