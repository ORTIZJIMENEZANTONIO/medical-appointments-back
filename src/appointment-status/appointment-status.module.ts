import { Module } from '@nestjs/common';
import { AppointmentStatusService } from './appointment-status.service';
import { AppointmentStatusController } from './appointment-status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentStatus } from './entities/appointment-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentStatus])],
  controllers: [AppointmentStatusController],
  providers: [AppointmentStatusService],
})
export class AppointmentStatusModule {}
