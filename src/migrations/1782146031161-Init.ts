import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782146031161 implements MigrationInterface {
    name = 'Init1782146031161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`appointment_status\` (\`id\` tinyint NOT NULL, \`name\` varchar(30) NOT NULL, UNIQUE INDEX \`IDX_4fec1f328aaaeb498d77d3d0a3\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patients\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`last_name_1\` varchar(50) NOT NULL, \`last_name_2\` varchar(50) NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(10) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_64e2031265399f5690b0beba6a\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`doctor_id\` int NOT NULL, \`patient_id\` int NOT NULL, \`status_id\` tinyint NOT NULL DEFAULT '1', \`reason\` varchar(255) NULL, \`appointment_date\` datetime(0) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`cancelled_at\` datetime(0) NULL, INDEX \`IDX_overlap_check\` (\`doctor_id\`, \`status_id\`, \`appointment_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`doctors\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`last_name_1\` varchar(50) NOT NULL, \`last_name_2\` varchar(50) NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(10) NOT NULL, \`specialty\` varchar(100) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_62069f52ebba471c91de5d59d6\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_4cf26c3f972d014df5c68d503d2\` FOREIGN KEY (\`doctor_id\`) REFERENCES \`doctors\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_3330f054416745deaa2cc130700\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_2b35dd864ffc9740d944427f790\` FOREIGN KEY (\`status_id\`) REFERENCES \`appointment_status\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_2b35dd864ffc9740d944427f790\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_3330f054416745deaa2cc130700\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_4cf26c3f972d014df5c68d503d2\``);
        await queryRunner.query(`DROP INDEX \`IDX_62069f52ebba471c91de5d59d6\` ON \`doctors\``);
        await queryRunner.query(`DROP TABLE \`doctors\``);
        await queryRunner.query(`DROP INDEX \`IDX_overlap_check\` ON \`appointments\``);
        await queryRunner.query(`DROP TABLE \`appointments\``);
        await queryRunner.query(`DROP INDEX \`IDX_64e2031265399f5690b0beba6a\` ON \`patients\``);
        await queryRunner.query(`DROP TABLE \`patients\``);
        await queryRunner.query(`DROP INDEX \`IDX_4fec1f328aaaeb498d77d3d0a3\` ON \`appointment_status\``);
        await queryRunner.query(`DROP TABLE \`appointment_status\``);
    }

}
