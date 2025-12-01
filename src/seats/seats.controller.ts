import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SeatsService } from './seats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get()
  findAll() {
    return this.seatsService.findAll();
  }

  @Post(':id/lock')
  @UseGuards(JwtAuthGuard)
  lock(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.seatsService.lockSeat(id, user.id);
  }
  
  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard)
  unlock(@Param('id') id: string) {
      return this.seatsService.unlockSeat(id);
  }
}
