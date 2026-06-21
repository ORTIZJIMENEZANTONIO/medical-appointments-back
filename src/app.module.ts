import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';

@Module({
  imports: [UsersModule, AppointmentsModule, PatientsModule, DoctorsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
