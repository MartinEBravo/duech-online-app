/**
 * Database connection module for DUECh PostgreSQL database.
 *
 * This module configures and exports the Drizzle ORM database instance.
 * It handles both production (Supabase with SSL) and development (local PostgreSQL) environments.
 *
 * @module lib/db
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/lib/schema';

const connectionString = process.env.POSTGRES_URL;

/**
 * PostgreSQL connection pool configured for either production (Supabase) or local development.
 *
 * Production configuration uses SSL with optional CA certificate verification.
 * Development configuration connects to localhost with basic credentials.
 *
 * Pool settings:
 * - max: 20 connections
 * - idleTimeoutMillis: 30000 (30 seconds)
 * - connectionTimeoutMillis: 5000 (production) / 2000 (development)
 */
const pool = connectionString
  ? // Production: Use connection string from Supabase
    new Pool({
      connectionString,
      ssl: process.env.SUPABASE_CA_CERT
        ? {
            ca: process.env.SUPABASE_CA_CERT.replace(/\\n/g, '\n'),
            rejectUnauthorized: true,
          }
        : {
            rejectUnauthorized: false,
          },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'duech',
      user: process.env.POSTGRES_USER || 'duech',
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on('error', () => {
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

/**
 * Drizzle ORM database instance with schema definitions.
 *
 * This is the main database interface used throughout the application
 * for all database operations including queries, inserts, updates, and deletes.
 *
 * @example
 * ```typescript
 * import { db } from '@/lib/db';
 *
 * // Query example
 * const words = await db.query.words.findMany();
 *
 * // Insert example
 * await db.insert(words).values({ lemma: 'example' });
 * ```
 */
export const db = drizzle(pool, { schema });
