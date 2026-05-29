import { Body, Controller, Get, Post } from '@nestjs/common';
import { ScoutService } from '../service/scout.service';
import { CreateScoutInput, RemandInput, WorkflowActionInput } from '../type/scout';

@Controller()
export class ScoutController {
  constructor(private readonly scoutService: ScoutService) {}

  @Get(['scouts', 'api/scouts'])
  findAll() {
    return this.scoutService.findAll();
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
}