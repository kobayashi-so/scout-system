import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ScoutService } from "../service/scout.service";
import {
  CreateScoutInput,
  DuplicateScoutInput,
  RemandInput,
  UpdateRemandedScoutInput,
  WorkflowActionInput,
} from "../type/scout";

@Controller()
export class ScoutController {
  constructor(private readonly scoutService: ScoutService) {}

  @Get(["scouts", "api/scouts"])
  findAll(@Query("includeDeleted") includeDeleted?: string) {
    const shouldIncludeDeleted = includeDeleted === "true";
    return this.scoutService.findAll(shouldIncludeDeleted);
  }

  @Get(["scouts/:id", "api/scouts/:id"])
  findDetail(@Param("id") id: string) {
    // レビュー画面向け: スカウト本文 + 求人情報を返却
    return this.scoutService.findDetailById(id);
  }

  @Get(["scouts/:id/comments", "api/scouts/:id/comments"])
  findComments(@Param("id") id: string) {
    // レビュー画面向け: 差戻しコメント履歴を返却
    return this.scoutService.findCommentsByScoutId(id);
  }

  @Post(["scouts", "api/scouts"])
  create(@Body() body: CreateScoutInput) {
    return this.scoutService.create(body);
  }

  @Post(["approve", "api/approve"])
  approve(@Body() body: WorkflowActionInput) {
    return this.scoutService.approve(body);
  }

  @Post(["final-approve", "api/final-approve"])
  finalApprove(@Body() body: WorkflowActionInput) {
    return this.scoutService.finalApprove(body);
  }

  @Post(["remand", "api/remand"])
  remand(@Body() body: RemandInput) {
    return this.scoutService.remand(body);
  }

  @Post(["scouts/:id/resubmit", "api/scouts/:id/resubmit"])
  resubmitRemanded(
    @Param("id") id: string,
    @Body() body: UpdateRemandedScoutInput,
  ) {
    // 差戻し文書の再申請（修正内容を保存し、承認フローを先頭に戻す）
    return this.scoutService.resubmitRemanded(id, body);
  }

  @Post(["scouts/:id/save-draft", "api/scouts/:id/save-draft"])
  saveDraft(@Param("id") id: string, @Body() body: UpdateRemandedScoutInput) {
    // 下書き文書の更新保存（statusはdraftのまま維持）
    return this.scoutService.saveDraft(id, body);
  }

  @Post(["scouts/:id/duplicate", "api/scouts/:id/duplicate"])
  duplicate(@Param("id") id: string, @Body() body: DuplicateScoutInput) {
    // 任意ステータスの文書を複製し、作成者を実行ユーザーで上書きした下書きを作成
    return this.scoutService.duplicateAsDraft(id, body);
  }

  @Post(["scouts/:id/delete", "api/scouts/:id/delete"])
  softDelete(@Param("id") id: string) {
    return this.scoutService.softDelete(id);
  }

  @Post(["scouts/:id/restore", "api/scouts/:id/restore"])
  restore(@Param("id") id: string) {
    return this.scoutService.restore(id);
  }

  @Delete(["scouts/:id", "api/scouts/:id"])
  hardDelete(@Param("id") id: string) {
    return this.scoutService.hardDelete(id);
  }
}
