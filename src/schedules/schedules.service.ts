import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { SeatsService } from '../seats/seats.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    private seatsService: SeatsService,
  ) {}

  async create(createScheduleDto: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.schedulesRepository.create(createScheduleDto);
    const savedSchedule = await this.schedulesRepository.save(schedule);
    await this.seatsService.createSeatsForSchedule(savedSchedule);
    return savedSchedule;
  }

  findAll(routeId?: string): Promise<Schedule[]> {
    const where = routeId ? { route: { id: routeId } } : {};
    return this.schedulesRepository.find({ where, relations: ['route', 'route.origin', 'route.destination', 'seats'] });
  }

  findOne(id: string): Promise<Schedule | null> {
    return this.schedulesRepository.findOne({ 
      where: { id }, 
      relations: ['route', 'route.origin', 'route.destination', 'seats'] 
    });
  }
}
