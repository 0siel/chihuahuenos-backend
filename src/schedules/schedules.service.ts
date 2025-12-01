import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
  ) {}

  create(createScheduleDto: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.schedulesRepository.create(createScheduleDto);
    return this.schedulesRepository.save(schedule);
  }

  findAll(routeId?: string): Promise<Schedule[]> {
    const where = routeId ? { route: { id: routeId } } : {};
    return this.schedulesRepository.find({ where, relations: ['route', 'route.origin', 'route.destination'] });
  }

  findOne(id: string): Promise<Schedule | null> {
    return this.schedulesRepository.findOne({ where: { id }, relations: ['route', 'seats'] });
  }
}
