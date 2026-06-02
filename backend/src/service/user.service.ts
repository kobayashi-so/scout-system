import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { UserRepository } from "../repository/user.repository";
import { UserEntity } from "../type/user";

type RoleType = "sales" | "leader" | "admin";

interface RegisterUserInput {
  userName: string;
  email: string;
  password: string;
  roleType: RoleType;
}

interface LoginUserInput {
  email: string;
  password: string;
}

interface UpdateProfileInput {
  userName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UserResponse {
  userId?: string;
  userName: string;
  email: string;
  roleType: RoleType;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ユーザー一覧を取得（パスワードは返却しない）
  async findAll(): Promise<UserResponse[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toUserResponse(user));
  }

  // 入力値検証 -> 重複チェック -> usersテーブル登録
  async register(input: RegisterUserInput): Promise<UserResponse> {
    this.validateRegisterInput(input);

    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException("このメールアドレスは既に登録されています");
    }

    let created: UserEntity;
    try {
      created = await this.userRepository.createUser({
        userName: input.userName.trim(),
        email: normalizedEmail,
        password: input.password,
        roleType: input.roleType,
      });
    } catch (error) {
      const isUniqueViolation =
        error instanceof QueryFailedError &&
        ((error as any)?.driverError?.code === "23505" ||
          (error as any)?.driverError?.constraint?.includes("email"));

      if (isUniqueViolation) {
        throw new BadRequestException("このメールアドレスは既に登録されています");
      }

      throw error;
    }

    // レスポンスにはパスワードを含めない
    return this.toUserResponse(created);
  }

  // usersテーブルの情報で認証
  async login(input: LoginUserInput): Promise<UserResponse> {
    if (!input.email?.trim() || !input.password) {
      throw new BadRequestException("メールアドレスとパスワードは必須です");
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException("メールアドレスが登録されていません");
    }

    if (user.password !== input.password) {
      throw new UnauthorizedException("パスワードが正しくありません");
    }

    return this.toUserResponse(user);
  }

  // 管理者のみ、ユーザー権限を変更可能
  async updateRole(
    userId: string,
    roleType: RoleType,
    actorRoleType: RoleType,
  ): Promise<UserResponse> {
    this.assertAdmin(actorRoleType);

    if (!["sales", "leader", "admin"].includes(roleType)) {
      throw new BadRequestException("権限区分が不正です");
    }

    const updated = await this.userRepository.updateRole(userId, roleType);
    if (!updated) {
      throw new NotFoundException("対象ユーザーが見つかりません");
    }

    return this.toUserResponse(updated);
  }

  // 管理者のみ、ユーザーを削除可能
  async remove(
    userId: string,
    actorRoleType: RoleType,
  ): Promise<{ success: true }> {
    this.assertAdmin(actorRoleType);

    const deleted = await this.userRepository.deleteById(userId);
    if (!deleted) {
      throw new NotFoundException("対象ユーザーが見つかりません");
    }

    return { success: true };
  }

  // 本人のプロフィール更新（userName/email/password）
  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserResponse> {
    if (!userId?.trim()) {
      throw new BadRequestException("ユーザーIDは必須です");
    }

    const targetUser = await this.userRepository.findById(userId.trim());
    if (!targetUser) {
      throw new NotFoundException("対象ユーザーが見つかりません");
    }

    const nextUserName =
      input.userName !== undefined
        ? input.userName.trim()
        : targetUser.userName;
    const nextEmail =
      input.email !== undefined
        ? input.email.trim().toLowerCase()
        : targetUser.email;

    if (!nextUserName) {
      throw new BadRequestException("ユーザー名は必須です");
    }

    if (!nextEmail) {
      throw new BadRequestException("メールアドレスは必須です");
    }

    if (nextEmail !== targetUser.email) {
      const existing = await this.userRepository.findByEmail(nextEmail);
      if (existing && existing.userId !== targetUser.userId) {
        throw new BadRequestException(
          "このメールアドレスは既に登録されています",
        );
      }
    }

    let nextPassword = targetUser.password;
    const wantsToChangePassword =
      input.currentPassword !== undefined || input.newPassword !== undefined;

    if (wantsToChangePassword) {
      if (!input.currentPassword) {
        throw new BadRequestException("現在のパスワードを入力してください");
      }

      if (input.currentPassword !== targetUser.password) {
        throw new UnauthorizedException("現在のパスワードが正しくありません");
      }

      if (!input.newPassword || input.newPassword.length < 6) {
        throw new BadRequestException(
          "新しいパスワードは6文字以上で入力してください",
        );
      }

      nextPassword = input.newPassword;
    }

    const updated = await this.userRepository.updateProfile(userId.trim(), {
      userName: nextUserName,
      email: nextEmail,
      password: nextPassword,
    });

    if (!updated) {
      throw new NotFoundException("対象ユーザーが見つかりません");
    }

    return this.toUserResponse(updated);
  }

  private validateRegisterInput(input: RegisterUserInput) {
    if (!input.userName?.trim()) {
      throw new BadRequestException("ユーザー名は必須です");
    }

    if (!input.email?.trim()) {
      throw new BadRequestException("メールアドレスは必須です");
    }

    if (!input.password || input.password.length < 6) {
      throw new BadRequestException("パスワードは6文字以上で入力してください");
    }

    if (!["sales", "leader", "admin"].includes(input.roleType)) {
      throw new BadRequestException("権限区分が不正です");
    }
  }

  private assertAdmin(roleType: RoleType) {
    if (roleType !== "admin") {
      throw new ForbiddenException("管理者のみ実行できます");
    }
  }

  // API返却用に安全なユーザー情報へ整形
  private toUserResponse(user: UserEntity): UserResponse {
    return {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      roleType: user.roleType,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
