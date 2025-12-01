import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routesRepository: Repository<Route>,
  ) {}

  create(createRouteDto: Partial<Route>): Promise<Route> {
    const route = this.routesRepository.create(createRouteDto);
    return this.routesRepository.save(route);
  }

  findAll(): Promise<Route[]> {
    return this.routesRepository.find({ relations: ['origin', 'destination', 'schedules'] });
  }

  findOne(id: string): Promise<Route | null> {
    return this.routesRepository.findOne({ where: { id }, relations: ['origin', 'destination', 'schedules'] });
  }
}
