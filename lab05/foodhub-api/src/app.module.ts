import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { OrderingModule } from './ordering/ordering.module.js';

@Module({
  imports: [CatalogModule, OrderingModule],
  controllers: [AuthController],
})
export class AppModule {}
