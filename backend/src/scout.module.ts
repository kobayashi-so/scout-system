import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerateController } from './controller/ai-generate.controller';
import { CheckItemController } from './controller/check-item.controller';
import { ScoutController } from './controller/scout.controller';
import { UserController } from './controller/user.controller';
import { CheckItemRepository } from './repository/check-item.repository';
import { CommentRepository } from './repository/comment.repository';
import { ScoutRepository } from './repository/scout.repository';
import { UserRepository } from './repository/user.repository';
import { AiGenerateService } from './service/ai-generate.service';
import { CheckItemService } from './service/check-item.service';
import { ScoutService } from './service/scout.service';
import { UserService } from './service/user.service';
import { CheckItemEntity } from './type/check-item';
import { CommentEntity } from './type/comment';
import { ScoutEntity } from './type/scout';
import { UserEntity } from './type/user';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScoutEntity,
      UserEntity,
      CheckItemEntity,
      CommentEntity,
    ]),
  ],
  controllers: [
    ScoutController,
    AiGenerateController,
    UserController,
    CheckItemController,
  ],
  providers: [
    ScoutService,
    ScoutRepository,
    AiGenerateService,
    UserService,
    UserRepository,
    CheckItemService,
    CheckItemRepository,
    CommentRepository,
  ],
})
export class ScoutModule {}
