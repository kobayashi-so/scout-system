import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ScoutService } from '../service/scout.service';
import {
  CreateScoutInput,
  RemandInput,
  UpdateRemandedScoutInput,
  WorkflowActionInput,
} from '../type/scout';

@Controller()
export class ScoutController {
  constructor(private readonly scoutService: ScoutService) {}

  @Get(['scouts', 'api/scouts'])
  findAll() {
    return this.scoutService.findAll();
  }

  @Get(['scouts/:id', 'api/scouts/:id'])
  findDetail(@Param('id') id: string) {
    // レビュー画面向け: スカウト本文 + 求人情報を返却
    return this.scoutService.findDetailById(id);
  }

  @Get(['scouts/:id/comments', 'api/scouts/:id/comments'])
  findComments(@Param('id') id: string) {
    // レビュー画面向け: 差戻しコメント履歴を返却
    return this.scoutService.findCommentsByScoutId(id);
  }

  @Post(['scouts', 'api/scouts'])
  create(@Body() body: CreateScoutInput) {
    return this.scoutService.create(body);
  }

  @Post(['approve', 'api/approve'])
  approve(@Body() body: WorkflowActionInput) {
    return this.scoutService.approve(body);
  }

  @Post(['final-approve', 'api/final-approve'])
  finalApprove(@Body() body: WorkflowActionInput) {
    return this.scoutService.finalApprove(body);
  }

  @Post(['remand', 'api/remand'])
  remand(@Body() body: RemandInput) {
    return this.scoutService.remand(body);
  }

  @Post(['scouts/:id/resubmit', 'api/scouts/:id/resubmit'])
  resubmitRemanded(
    @Param('id') id: string,
    @Body() body: UpdateRemandedScoutInput,
  ) {
    // 差戻し文書の再申請（修正内容を保存し、承認フローを先頭に戻す）
    return this.scoutService.resubmitRemanded(id, body);
  }
}