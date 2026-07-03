import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToPositions1719853200000 implements MigrationInterface {
  name = 'AddEmailToPositions1719853200000';

public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn("positions", "email");

    if (!exists) {
        await queryRunner.query(`
            ALTER TABLE "positions"
            ADD COLUMN "email" character varying(255)
        `);
    }
}

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "positions"
      DROP COLUMN "email"
    `);
  }
}
