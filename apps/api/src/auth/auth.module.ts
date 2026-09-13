import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { UsersModule } from '../users/users.module';

const oauthProviders = [
  ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
  ...(process.env.GITHUB_CLIENT_ID ? [GithubStrategy] : []),
];

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.register({}),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, ...oauthProviders],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
