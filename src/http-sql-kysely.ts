import type { HttpFunction } from '@google-cloud/functions-framework';
import superjson from 'superjson';
import * as pg from 'pg';
import { Kysely, PostgresDialect, type CompiledQuery } from 'kysely';

superjson.registerCustom<Buffer, string>(
  {
    isApplicable: (v): v is Buffer => Buffer.isBuffer(v),
    serialize: v => v.toString('base64'),
    deserialize: v => Buffer.from(v, 'base64'),
  },
  'binary'
);

const kysely = new Kysely({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Keep it low for Cloud Functions
    })
  }),
});

export const httpSqlKysely: HttpFunction = async (req, res) => {
  if (!process.env.API_KEY || req.headers.authorization !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.body || typeof req.body !== 'string') {
    return res.status(400).json({ error: 'request body is required' });
  }

  const compiledQuery = superjson.parse(req.body) as CompiledQuery;

  try {
    const result = await kysely.executeQuery(compiledQuery);
    return res.send(superjson.stringify(result));
  } catch (e: any) {
    return res.status(500).json({ error: e });
  }
};