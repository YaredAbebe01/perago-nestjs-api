import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColomn1782976171108 implements MigrationInterface {
    name = 'AddColomn1782976171108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "positions"
            ADD "Fname" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "positions" 
            DROP COLUMN "Fname"`);
       
    }

}
