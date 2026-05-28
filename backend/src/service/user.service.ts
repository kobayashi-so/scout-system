import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { UserEntity } from '../type/user';

type RoleType = 'sales' | 'leader' | 'admin';

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

  // 入力値検証 -> 重複チェック -> usersテーブル登録
  async register(input: RegisterUserInput): Promise<UserResponse> {
    this.validateRegisterInput(input);

    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException('このメールアドレスは既に登録されています');
    }

    const created = await this.userRepository.createUser({
      userName: input.userName.trim(),
      email: normalizedEmail,
      password: input.password,
      roleType: input.roleType,
    });

    // レスポンスにはパスワードを含めない
    return this.toUserResponse(created);
  }

  // usersテーブルの情報で認証
  async login(input: LoginUserInput): Promise<UserResponse> {
    if (!input.email?.trim() || !input.password) {
      throw new BadRequestException('メールアドレスとパスワードは必須です');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || user.password !== input.password) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません');
    }

    return this.toUserResponse(user);
  }

  private validateRegisterInput(input: RegisterUserInput) {
    if (!input.userName?.trim()) {
      throw new BadRequestException('ユーザー名は必須です');
    }

    if (!input.email?.trim()) {
      throw new BadRequestException('メールアドレスは必須です');
    }

    if (!input.password || input.password.length < 6) {
      throw new BadRequestException('パスワードは6文字以上で入力してください');
    }

    if (!['sales', 'leader', 'admin'].includes(input.roleType)) {
      throw new BadRequestException('権限区分が不正です');
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
