import type { HttpFunction } from '@google-cloud/functions-framework';
import superjson from 'superjson';
import * as pg from 'pg';
import type { TypeId } from 'pg-types';
import { Kysely, PostgresDialect } from 'kysely';

superjson.registerCustom<Buffer, string>(
  {
    isApplicable: (v): v is Buffer => Buffer.isBuffer(v),
    serialize: v => v.toString('base64'),
    deserialize: v => Buffer.from(v, 'base64'),
  },
  'binary'
);

const deserialize = (str: string): any => {
  const parsed = superjson.parse(str);

  console.log('deserialize called', {str, parsed});

  return parsed;
};

const serialize = (value: any): string => {
  const stringified = superjson.stringify(value);
  console.log('serialize called', {value, stringified});
  return stringified;
};

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

  const compiledQuery = deserialize(req.body);

  console.log('compiledQuery', compiledQuery);

  try {
    const result = await kysely.executeQuery(compiledQuery);
    return res.send(serialize(result));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e });
  }
};