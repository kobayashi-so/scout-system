import { Body, Controller, Post } from '@nestjs/common';
import { UserService, type UserResponse } from '../service/user.service';

// ユーザー認証（登録・ログイン）API
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // usersテーブルへ新規ユーザーを登録
  @Post('register')
  register(
    @Body()
    body: {
      userName: string;
      email: string;
      password: string;
      roleType: 'sales' | 'leader' | 'admin';
    },
  ): Promise<UserResponse> {
    return this.userService.register(body);
  }

  // メールアドレスとパスワードでログイン
  @Post('login')
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ): Promise<UserResponse> {
    return this.userService.login(body);
  }
}
