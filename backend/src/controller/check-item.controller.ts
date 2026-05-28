import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CheckItemService } from '../service/check-item.service';

type CheckItemPayload = {
  checkTitle: string;
};

@Controller('api/check-items')
export class CheckItemController {
  constructor(private readonly checkItemService: CheckItemService) {}

  @Get()
  findAll() {
    return this.checkItemService.findAll();
  }

  @Post()
  create(@Body() body: CheckItemPayload) {
    return this.checkItemService.create(body.checkTitle);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CheckItemPayload) {
    return this.checkItemService.update(id, body.checkTitle);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.checkItemService.remove(id);
    return { success: true };
  }
}
