import 'reflect-metadata';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { createTypeOrmOptions } from './database/typeorm-options';

const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  const envFileContent = readFileSync(envPath, 'utf8');
  for (const line of envFileContent.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const dataSource = new DataSource(
  createTypeOrmOptions(process.env.DATABASE_URL),
);

export default dataSource;
