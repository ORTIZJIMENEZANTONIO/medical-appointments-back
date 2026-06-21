import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAppointmentStatus1782077134190 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO appointment_status (name)
        VALUES ( 'ACTIVE'), ( 'CANCELLED');
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM appointment_status WHERE name IN ( 'ACTIVE', 'CANCELLED');
    `);
  }
}
