import { Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ArrayNotEmpty, IsIn, IsInt, IsString } from 'class-validator';
import { OrdersService } from './orders.service.js';

export class CreateOrderDto {
  @IsInt() restaurantId!: number;
  @ArrayNotEmpty() @IsString({ each: true }) items!: string[];
}

export class UpdateOrderDto {
  @IsIn(['COOKING', 'DELIVERING', 'DELIVERED', 'CANCELLED']) status!: string;
}

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { order, created } = await this.orders.place(dto.restaurantId, dto.items, key);
    if (!created) res.status(200); // same request again: return the first result
    return order;
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.get(id);
  }

  @Patch(':id')
  changeStatus(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.changeStatus(id, dto.status);
  }
}
