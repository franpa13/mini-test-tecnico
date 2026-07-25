import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepoDto } from './dto/user-repo.dto';
import { UserActivityDto } from './dto/user-activity.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  getProfile(@Param('username') username: string): Promise<UserProfileDto> {
    return this.userService.getProfile(username);
  }

  @Get(':username/repos')
  getRepos(@Param('username') username: string): Promise<UserRepoDto[]> {
    return this.userService.getRepos(username);
  }

  @Get(':username/activity')
  getActivity(@Param('username') username: string): Promise<UserActivityDto[]> {
    return this.userService.getActivity(username);
  }
}
