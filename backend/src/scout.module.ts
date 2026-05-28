import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerateController } from './controller/ai-generate.controller';
import { CheckItemController } from './controller/check-item.controller';
import { ScoutController } from './controller/scout.controller';
import { CheckItemRepository } from './repository/check-item.repository';
import { ScoutRepository } from './repository/scout.repository';
import { AiGenerateService } from './service/ai-generate.service';
import { CheckItemService } from './service/check-item.service';
import { ScoutService } from './service/scout.service';
import { CheckItemEntity } from './type/check-item';
import { ScoutEntity } from './type/scout';

@Module({
  imports: [TypeOrmModule.forFeature([ScoutEntity, CheckItemEntity])],
  controllers: [ScoutController, AiGenerateController, CheckItemController],
  providers: [
    ScoutService,
    ScoutRepository,
    AiGenerateService,
    CheckItemService,
    CheckItemRepository,
  ],
})
export class ScoutModule {}
