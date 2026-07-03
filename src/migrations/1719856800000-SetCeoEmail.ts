import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCeoEmail1719856800000 implements MigrationInterface {
  name = 'SetCeoEmail1719856800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "positions"
      SET "email" = 'yaredabebe@gmail.com'
      WHERE "id" = '8b3a4fe0-c656-4319-8ab9-cabd77d9e4b4'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "positions"
      SET "email" = NULL
      WHERE "id" = '8b3a4fe0-c656-4319-8ab9-cabd77d9e4b4'
    `);
  }
}
