import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1719849600000 implements MigrationInterface {
  name = 'InitialSchema1719849600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "photo" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "filename" character varying NOT NULL,
        "views" double precision NOT NULL,
        "isPublished" boolean NOT NULL,
        CONSTRAINT "PK_7d3b0a70ed8c8e6f14ed3b8f3d8" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "positions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "description" character varying(500) NOT NULL,
        "parentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_204e949488fea2b1e66c628c21f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "positions"
      ADD CONSTRAINT "FK_positions_parentId"
      FOREIGN KEY ("parentId") REFERENCES "positions"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "positions" DROP CONSTRAINT "FK_positions_parentId"`);
    await queryRunner.query('DROP TABLE IF EXISTS "positions"');
    await queryRunner.query('DROP TABLE IF EXISTS "photo"');
    await queryRunner.query('DROP TABLE IF EXISTS "user"');
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
}
