import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAppointmentStatus1782146036907 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO appointment_status (id, name) VALUES (1, 'ACTIVE'), (2, 'CANCELLED');`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM appointment_status WHERE id IN (1, 2);`,
    );
  }
}
