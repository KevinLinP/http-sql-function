import type { HttpFunction } from '@google-cloud/functions-framework';
import { EJSON } from 'bson';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

const deserialize = (str: string): any => {
  const parsed = JSON.parse(str);
  return EJSON.deserialize(parsed);
};

const serialize = (value: any): string => {
  const serialized = EJSON.serialize(value);
  return JSON.stringify(serialized);
};

const kysely = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Keep it low for Cloud Functions
    })
  }),
});

export const httpSql: HttpFunction = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.query.q || typeof req.query.q !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const compiledQuery = deserialize(req.query.q);

  try {
    const result = await kysely.executeQuery(compiledQuery);
    return res.send(serialize(result));
  } catch (e: any) {
    return res.status(500).json({ error: e });
  }
};