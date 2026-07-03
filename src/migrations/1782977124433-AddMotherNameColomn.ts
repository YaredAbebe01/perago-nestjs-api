import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMotherNameColomn1782977124433 implements MigrationInterface {
    name = 'AddMotherNameColomn1782977124433'

 public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "positions"
            ADD "Mname" character varying(255)`);
    }

 public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "positions"
            DROP "Mname" character varying(255)`);
    }
}
