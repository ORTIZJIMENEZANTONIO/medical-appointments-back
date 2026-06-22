import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Agendar una cita (30 min, sin empalmes por doctor)' })
  @ApiResponse({ status: 201, description: 'Cita agendada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o fecha no futura' })
  @ApiResponse({ status: 404, description: 'El doctor o el paciente no existe' })
  @ApiResponse({
    status: 409,
    description: 'El doctor ya tiene una cita activa que se traslapa',
  })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar citas (filtros por doctor, status y rango)' })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  findAll(@Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por id' })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiResponse({ status: 200, description: 'Cita cancelada' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  @ApiResponse({ status: 409, description: 'La cita ya está cancelada' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(id);
  }
}
