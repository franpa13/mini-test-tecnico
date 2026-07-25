import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GithubApiClient } from './github-api.client';

@Module({
  controllers: [UserController],
  providers: [UserService, GithubApiClient],
})
export class UserModule {}
