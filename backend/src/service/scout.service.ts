import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepository } from '../repository/comment.repository';
import { ScoutRepository } from '../repository/scout.repository';
import { UserRepository } from '../repository/user.repository';
import {
  CreateScoutInput,
  RemandInput,
  RoleType,
  SCOUT_STATUSES,
  ScoutEntity,
  ScoutStatus,
  WorkflowActionInput,
} from '../type/scout';

const REMANDABLE_STATUSES: ScoutStatus[] = ['waiting_leader', 'waiting_admin'];

@Injectable()
export class ScoutService {
  constructor(
    private readonly scoutRepository: ScoutRepository,
    private readonly userRepository: UserRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  findAll(): Promise<ScoutEntity[]> {
    return this.scoutRepository.findAll();
  }

  async create(input: CreateScoutInput): Promise<ScoutEntity> {
    if (!input.creator?.trim() || !input.title?.trim() || !input.body?.trim()) {
      throw new BadRequestException('作成者・タイトル・本文は必須です');
    }

    if (!input.requirement) {
      throw new BadRequestException('求人情報が不足しています');
    }

    const scout = new ScoutEntity();
    scout.id = this.generateId();
    scout.creator = input.creator.trim();
    scout.title = input.title.trim();
    scout.body = input.body.trim();
    scout.status = this.normalizeStatus(input.status) || 'draft';

    return this.scoutRepository.saveWithRequirement(scout, input);
  }

  async approve(input: WorkflowActionInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, 'scoutIdは必須です');
    const userId = this.requireText(input.userId, 'userIdは必須です');

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    if (user.roleType !== 'leader') {
      throw new ForbiddenException('リーダーのみ承認できます');
    }

    if (scout.status !== 'waiting_leader') {
      throw new ConflictException('現在のステータスではリーダー承認できません');
    }

    const updated = await this.scoutRepository.approveByLeader(
      scout.id as string,
      userId,
    );
    if (!updated) {
      throw new ConflictException('ステータスが更新されたため承認を完了できませんでした');
    }

    return updated;
  }

  async finalApprove(input: WorkflowActionInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, 'scoutIdは必須です');
    const userId = this.requireText(input.userId, 'userIdは必須です');

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    if (user.roleType !== 'admin') {
      throw new ForbiddenException('管理者のみ最終承認できます');
    }

    if (scout.status !== 'waiting_admin') {
      throw new ConflictException('現在のステータスでは最終承認できません');
    }

    const updated = await this.scoutRepository.finalApprove(
      scout.id as string,
      userId,
    );
    if (!updated) {
      throw new ConflictException('ステータスが更新されたため最終承認を完了できませんでした');
    }

    return updated;
  }

  async remand(input: RemandInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, 'scoutIdは必須です');
    const userId = this.requireText(input.userId, 'userIdは必須です');
    const comment = this.requireText(input.comment, 'commentは必須です');

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    if (!['leader', 'admin'].includes(user.roleType)) {
      throw new ForbiddenException('差し戻しはリーダーまたは管理者のみ実行できます');
    }

    if (!REMANDABLE_STATUSES.includes(scout.status)) {
      throw new ConflictException('現在のステータスでは差し戻しできません');
    }

    const updated = await this.scoutRepository.remand(
      scout.id as string,
      scout.status,
    );
    if (!updated) {
      throw new ConflictException('ステータスが更新されたため差し戻しを完了できませんでした');
    }

    await this.commentRepository.createComment({
      targetScoutId: scout.id as string,
      authorId: userId,
      content: comment,
    });

    return updated;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  private requireText(value: string, message: string): string {
    if (!value?.trim()) {
      throw new BadRequestException(message);
    }

    return value.trim();
  }

  private normalizeStatus(status?: string): ScoutStatus | undefined {
    if (!status?.trim()) {
      return undefined;
    }

    const normalized = status.trim() as ScoutStatus;
    if (!SCOUT_STATUSES.includes(normalized)) {
      throw new BadRequestException('statusの値が不正です');
    }

    return normalized;
  }

  private async getScoutOrThrow(scoutId: string): Promise<ScoutEntity> {
    const scout = await this.scoutRepository.findById(scoutId);
    if (!scout) {
      throw new NotFoundException('対象スカウトが見つかりません');
    }

    return scout;
  }

  private async getUserOrThrow(userId: string): Promise<{ roleType: RoleType }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('対象ユーザーが見つかりません');
    }

    return user;
  }
}