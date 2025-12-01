import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Schedule } from './entities/schedule.entity';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(@Body() createScheduleDto: Partial<Schedule>) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  findAll(@Query('routeId') routeId?: string) {
    return this.schedulesService.findAll(routeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }
}
