import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CheckItemRepository } from '../repository/check-item.repository';
import { CheckItemEntity } from '../type/check-item';

@Injectable()
export class CheckItemService {
  constructor(private readonly checkItemRepository: CheckItemRepository) {}

  findAll(): Promise<CheckItemEntity[]> {
    return this.checkItemRepository.findAllActive();
  }

  async create(checkTitle: string): Promise<CheckItemEntity> {
    const trimmedTitle = checkTitle?.trim();
    if (!trimmedTitle) {
      throw new BadRequestException('チェック項目名は必須です');
    }

    const id = randomUUID();
    return this.checkItemRepository.createWithNextOrder(id, trimmedTitle);
  }

  async update(id: string, checkTitle: string): Promise<CheckItemEntity> {
    const trimmedTitle = checkTitle?.trim();
    if (!trimmedTitle) {
      throw new BadRequestException('チェック項目名は必須です');
    }

    const updated = await this.checkItemRepository.updateTitle(id, trimmedTitle);
    if (!updated) {
      throw new NotFoundException('対象のチェック項目が見つかりません');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.checkItemRepository.softDeleteAndReorder(id);
    if (!deleted) {
      throw new NotFoundException('対象のチェック項目が見つかりません');
    }
  }
}
