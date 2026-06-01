import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { UserService, type UserResponse } from "../service/user.service";

// ユーザー認証（登録・ログイン）API
@Controller("api/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ユーザー一覧を取得
  @Get()
  findAll(): Promise<UserResponse[]> {
    return this.userService.findAll();
  }

  // usersテーブルへ新規ユーザーを登録
  @Post("register")
  register(
    @Body()
    body: {
      userName: string;
      email: string;
      password: string;
      roleType: "sales" | "leader" | "admin";
    },
  ): Promise<UserResponse> {
    return this.userService.register(body);
  }

  // メールアドレスとパスワードでログイン
  @Post("login")
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ): Promise<UserResponse> {
    return this.userService.login(body);
  }

  // 管理者のみ、ユーザーの権限を変更可能
  @Patch(":id/role")
  updateRole(
    @Param("id") id: string,
    @Body()
    body: {
      roleType: "sales" | "leader" | "admin";
      actorRoleType: "sales" | "leader" | "admin";
    },
  ): Promise<UserResponse> {
    return this.userService.updateRole(id, body.roleType, body.actorRoleType);
  }

  // 本人のプロフィール情報（名前/メール/パスワード）を更新
  @Patch(":id/profile")
  updateProfile(
    @Param("id") id: string,
    @Body()
    body: {
      userName?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ): Promise<UserResponse> {
    return this.userService.updateProfile(id, body);
  }

  // 管理者のみ、ユーザーを削除可能
  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Body()
    body: {
      actorRoleType: "sales" | "leader" | "admin";
    },
  ): Promise<{ success: true }> {
    return this.userService.remove(id, body.actorRoleType);
  }
}
