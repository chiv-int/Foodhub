import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('v1/restaurants')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query('limit') limit = '20', @Query('offset') offset = '0') {
    return this.catalog.list(Number(limit), Number(offset));
  }
}
