const { spawnSync } = require('child_process');
const path = require('path');

const command = process.argv[2];
const commandArgs = process.argv.slice(3);

if (!command) {
  console.error('Usage: node scripts/typeorm.js <command> [name]');
  process.exit(1);
}

const typeormCliPath = path.resolve(__dirname, '../node_modules/typeorm/cli.js');
const dataSourcePath = path.resolve(__dirname, '../src/data-source.ts');
const args = [
  '--require',
  'ts-node/register',
  '--require',
  'tsconfig-paths/register',
  typeormCliPath,
  '-d',
  dataSourcePath,
  command,
];

if (command === 'migration:generate' || command === 'migration:create') {
  const migrationName = commandArgs[0];

  if (!migrationName) {
    console.error('Usage: node scripts/typeorm.js ' + command + ' <migration-name>');
    process.exit(1);
  }

  if (command === 'migration:create') {
    const timestamp = Date.now();
    const fileName = timestamp + '-' + migrationName + '.ts';
    const migrationPath = path.resolve(__dirname, '../src/migrations', fileName);
    const className = migrationName
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const fs = require('fs');
    fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
    fs.writeFileSync(
      migrationPath,
      [
        "import { MigrationInterface, QueryRunner } from 'typeorm';",
        '',
        `export class ${className}${timestamp} implements MigrationInterface {`,
        `  name = '${className}${timestamp}';`,
        '',
        '  public async up(queryRunner: QueryRunner): Promise<void> {',
        '    // Add migration steps here.',
        '  }',
        '',
        '  public async down(queryRunner: QueryRunner): Promise<void> {',
        '    // Revert migration steps here.',
        '  }',
        '}',
        '',
      ].join('\n'),
      'utf8',
    );

    console.log('Created migration:', migrationPath);
    process.exit(0);
  }

  args.push('src/migrations/' + migrationName);
  args.push(...commandArgs.slice(1));
} else {
  args.push(...commandArgs);
}

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 1);
