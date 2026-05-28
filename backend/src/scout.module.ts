import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerateController } from './controller/ai-generate.controller';
import { ScoutController } from './controller/scout.controller';
import { UserController } from './controller/user.controller';
import { ScoutRepository } from './repository/scout.repository';
import { UserRepository } from './repository/user.repository';
import { AiGenerateService } from './service/ai-generate.service';
import { ScoutService } from './service/scout.service';
import { UserService } from './service/user.service';
import { ScoutEntity } from './type/scout';
import { UserEntity } from './type/user';

@Module({
  imports: [TypeOrmModule.forFeature([ScoutEntity, UserEntity])],
  controllers: [ScoutController, AiGenerateController, UserController],
  providers: [ScoutService, ScoutRepository, AiGenerateService, UserService, UserRepository],
})
export class ScoutModule {}
