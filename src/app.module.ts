import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Route } from './routes/entities/route.entity';
import { Seat } from './seats/entities/seat.entity';
import { RoutesModule } from './routes/routes.module';
import { SeatsModule } from './seats/seats.module';
import { UploadModule } from './upload/upload.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { Location } from './locations/entities/location.entity';
import { LocationsModule } from './locations/locations.module';
import { Schedule } from './schedules/entities/schedule.entity';
import { SchedulesModule } from './schedules/schedules.module';
import { Booking } from './bookings/entities/booking.entity';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'chihuahuenos',
      entities: [Route, Seat, User, Location, Schedule, Booking],
      synchronize: true, // Auto-create tables (dev only)
    }),
    RoutesModule,
    SeatsModule,
    UploadModule,
    UsersModule,
    AuthModule,
    LocationsModule,
    SchedulesModule,
    BookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
