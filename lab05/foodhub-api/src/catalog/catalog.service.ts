import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository.js';

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  list(limit: number, offset: number) {
    const all = this.repository.findAll();
    return { data: all.slice(offset, offset + limit), limit, offset, total: all.length };
  }

  restaurantExists(id: number): boolean {
    return this.repository.findById(id) !== undefined;
  }
}
