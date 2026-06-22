import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782087115706 implements MigrationInterface {
    name = 'Init1782087115706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "appointment_status" ("id" tinyint NOT NULL, "name" varchar(30) NOT NULL, CONSTRAINT "UQ_4fec1f328aaaeb498d77d3d0a34" UNIQUE ("name"), CONSTRAINT "PK_8f42047c7975a9606576ca274e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patients" ("id" int NOT NULL IDENTITY(1,1), "name" varchar(50) NOT NULL, "last_name_1" varchar(50) NOT NULL, "last_name_2" varchar(50), "email" varchar(150) NOT NULL, "phone" varchar(10) NOT NULL, "created_at" datetime2(0) NOT NULL CONSTRAINT "DF_3a05bad054cc3068964c1241e19" DEFAULT GETDATE(), CONSTRAINT "UQ_64e2031265399f5690b0beba6a5" UNIQUE ("email"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" int NOT NULL IDENTITY(1,1), "doctor_id" int NOT NULL, "patient_id" int NOT NULL, "status_id" tinyint NOT NULL CONSTRAINT "DF_2b35dd864ffc9740d944427f790" DEFAULT 1, "reason" varchar(255), "appointment_date" datetime2(0) NOT NULL, "created_at" datetime2(0) NOT NULL CONSTRAINT "DF_387464fb81909344c275230cc08" DEFAULT GETDATE(), "cancelled_at" datetime2(0), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_doctor_active_slot" ON "appointments" ("doctor_id", "appointment_date") WHERE status_id = 1`);
        await queryRunner.query(`CREATE INDEX "IDX_overlap_check" ON "appointments" ("doctor_id", "status_id", "appointment_date") `);
        await queryRunner.query(`CREATE TABLE "doctors" ("id" int NOT NULL IDENTITY(1,1), "name" varchar(50) NOT NULL, "last_name_1" varchar(50) NOT NULL, "last_name_2" varchar(50), "email" varchar(150) NOT NULL, "phone" varchar(10) NOT NULL, "specialty" varchar(100), "created_at" datetime2(0) NOT NULL CONSTRAINT "DF_3b3abdb398e9a109897e3942949" DEFAULT GETDATE(), CONSTRAINT "UQ_62069f52ebba471c91de5d59d61" UNIQUE ("email"), CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_2b35dd864ffc9740d944427f790" FOREIGN KEY ("status_id") REFERENCES "appointment_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_2b35dd864ffc9740d944427f790"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_3330f054416745deaa2cc130700"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
        await queryRunner.query(`DROP INDEX "IDX_overlap_check" ON "appointments"`);
        await queryRunner.query(`DROP INDEX "UQ_doctor_active_slot" ON "appointments"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TABLE "appointment_status"`);
    }

}
