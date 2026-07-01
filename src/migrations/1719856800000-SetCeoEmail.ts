import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCeoEmail1719856800000 implements MigrationInterface {
  name = 'SetCeoEmail1719856800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "positions"
      SET "email" = 'yaredabebe@gmail.com'
      WHERE "id" = 'dc013880-6412-48ca-b6c8-0040f96bef49'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "positions"
      SET "email" = NULL
      WHERE "id" = 'dc013880-6412-48ca-b6c8-0040f96bef49'
    `);
  }
}
