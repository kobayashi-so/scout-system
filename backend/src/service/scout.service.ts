import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CommentRepository } from "../repository/comment.repository";
import { ScoutRepository } from "../repository/scout.repository";
import { UserRepository } from "../repository/user.repository";
import {
  CreateScoutInput,
  RemandInput,
  RoleType,
  SCOUT_STATUSES,
  ScoutDetail,
  ScoutEntity,
  ScoutStatus,
  UpdateRemandedScoutInput,
  WorkflowActionInput,
} from "../type/scout";
import { CommentEntity } from "../type/comment";

const REMANDABLE_STATUSES: ScoutStatus[] = ["waiting_leader", "waiting_admin"];

@Injectable()
export class ScoutService {
  constructor(
    private readonly scoutRepository: ScoutRepository,
    private readonly userRepository: UserRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  findAll(includeDeleted = false): Promise<ScoutEntity[]> {
    return this.scoutRepository.findAll(includeDeleted);
  }

  async findDetailById(scoutId: string): Promise<ScoutDetail> {
    // レビュー画面表示用の詳細取得
    const normalizedScoutId = this.requireText(scoutId, "scoutIdは必須です");
    const scout = await this.scoutRepository.findDetailById(normalizedScoutId);
    if (!scout) {
      throw new NotFoundException("対象スカウトが見つかりません");
    }

    return scout;
  }

  async findCommentsByScoutId(scoutId: string): Promise<CommentEntity[]> {
    // 対象スカウトの差戻しコメント履歴を取得
    const normalizedScoutId = this.requireText(scoutId, "scoutIdは必須です");
    await this.getScoutOrThrow(normalizedScoutId);
    return this.commentRepository.findByScoutId(normalizedScoutId);
  }

  async create(input: CreateScoutInput): Promise<ScoutEntity> {
    if (!input.creator?.trim() || !input.title?.trim() || !input.body?.trim()) {
      throw new BadRequestException("作成者・タイトル・本文は必須です");
    }

    if (!input.requirement) {
      throw new BadRequestException("求人情報が不足しています");
    }

    const scout = new ScoutEntity();
    scout.id = this.generateId();
    scout.creator = input.creator.trim();
    scout.title = input.title.trim();
    scout.body = input.body.trim();
    scout.status = this.normalizeStatus(input.status) || "draft";

    return this.scoutRepository.saveWithRequirement(scout, input);
  }

  async approve(input: WorkflowActionInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, "scoutIdは必須です");
    const userId = this.requireText(input.userId, "userIdは必須です");

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    // 要件: leader かつ waiting_leader のときのみ承認可能
    if (user.roleType !== "leader") {
      throw new ForbiddenException("リーダーのみ承認できます");
    }

    if (scout.status !== "waiting_leader") {
      throw new ConflictException("現在のステータスではリーダー承認できません");
    }

    const updated = await this.scoutRepository.approveByLeader(
      scout.id as string,
      userId,
    );
    if (!updated) {
      throw new ConflictException(
        "ステータスが更新されたため承認を完了できませんでした",
      );
    }

    return updated;
  }

  async finalApprove(input: WorkflowActionInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, "scoutIdは必須です");
    const userId = this.requireText(input.userId, "userIdは必須です");

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    // 要件: admin かつ waiting_admin のときのみ最終承認可能
    if (user.roleType !== "admin") {
      throw new ForbiddenException("管理者のみ最終承認できます");
    }

    if (scout.status !== "waiting_admin") {
      throw new ConflictException("現在のステータスでは最終承認できません");
    }

    const updated = await this.scoutRepository.finalApprove(
      scout.id as string,
      userId,
    );
    if (!updated) {
      throw new ConflictException(
        "ステータスが更新されたため最終承認を完了できませんでした",
      );
    }

    return updated;
  }

  async remand(input: RemandInput): Promise<ScoutEntity> {
    const scoutId = this.requireText(input.scoutId, "scoutIdは必須です");
    const userId = this.requireText(input.userId, "userIdは必須です");
    const comment = this.requireText(input.comment, "commentは必須です");

    const scout = await this.getScoutOrThrow(scoutId);
    const user = await this.getUserOrThrow(userId);

    // 要件: 差戻しは leader/admin のみ
    if (!["leader", "admin"].includes(user.roleType)) {
      throw new ForbiddenException(
        "差し戻しはリーダーまたは管理者のみ実行できます",
      );
    }

    if (!REMANDABLE_STATUSES.includes(scout.status)) {
      throw new ConflictException("現在のステータスでは差し戻しできません");
    }

    const updated = await this.scoutRepository.remand(
      scout.id as string,
      scout.status,
    );
    if (!updated) {
      throw new ConflictException(
        "ステータスが更新されたため差し戻しを完了できませんでした",
      );
    }

    // スカウト状態更新後にコメント履歴を保存
    await this.commentRepository.createComment({
      targetScoutId: scout.id as string,
      authorId: userId,
      content: comment,
    });

    return updated;
  }

  async resubmitRemanded(
    scoutId: string,
    input: UpdateRemandedScoutInput,
  ): Promise<ScoutEntity> {
    // Path Param のIDを正規化（空文字や空白のみを拒否）
    const normalizedScoutId = this.requireText(scoutId, "scoutIdは必須です");

    if (!input.title?.trim() || !input.body?.trim()) {
      throw new BadRequestException("タイトル・本文は必須です");
    }

    if (!input.requirement) {
      throw new BadRequestException("求人情報が不足しています");
    }

    // 差戻し/下書き文書を更新し、再申請状態へ戻す
    const updated = await this.scoutRepository.resubmitRemandedScout(
      normalizedScoutId,
      input,
    );
    if (!updated) {
      throw new ConflictException(
        "差し戻し中または下書きの文書のみ再申請できます",
      );
    }

    return updated;
  }

  async softDelete(scoutId: string): Promise<ScoutEntity> {
    const normalizedScoutId = this.requireText(scoutId, 'scoutIdは必須です');
    const deleted = await this.scoutRepository.softDelete(normalizedScoutId);
    if (!deleted) {
      throw new NotFoundException('対象スカウトが見つかりません');
    }

    return deleted;
  }

  async restore(scoutId: string): Promise<ScoutEntity> {
    const normalizedScoutId = this.requireText(scoutId, 'scoutIdは必須です');
    const restored = await this.scoutRepository.restore(normalizedScoutId);
    if (!restored) {
      throw new NotFoundException('対象スカウトが見つかりません');
    }

    return restored;
  }

  async hardDelete(scoutId: string): Promise<{ deleted: boolean }> {
    const normalizedScoutId = this.requireText(scoutId, 'scoutIdは必須です');
    const deleted = await this.scoutRepository.hardDelete(normalizedScoutId);
    return { deleted };
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
      throw new BadRequestException("statusの値が不正です");
    }

    return normalized;
  }

  private async getScoutOrThrow(scoutId: string): Promise<ScoutEntity> {
    const scout = await this.scoutRepository.findById(scoutId);
    if (!scout) {
      throw new NotFoundException("対象スカウトが見つかりません");
    }

    return scout;
  }

  private async getUserOrThrow(
    userId: string,
  ): Promise<{ roleType: RoleType }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("対象ユーザーが見つかりません");
    }

    return user;
  }
}
