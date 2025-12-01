import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('purchase')
  purchase(@Body() createBookingDto: CreateBookingDto, @Req() req: Request) {
    const user = req.user as any;
    return this.bookingsService.createBooking(user.id, createBookingDto);
  }

  @Get('my-bookings')
  myBookings(@Req() req: Request) {
    const user = req.user as any;
    return this.bookingsService.findUserBookings(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.bookingsService.findOne(id, user.id);
  }
}
