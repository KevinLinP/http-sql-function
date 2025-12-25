import type { HttpFunction } from '@google-cloud/functions-framework';
import { EJSON, Binary } from 'bson';
import * as pg from 'pg';
import type { TypeId } from 'pg-types';
import { Kysely, PostgresDialect } from 'kysely';

const deserialize = (str: string): any => {
  const parsed = JSON.parse(str);
  const deserialized = EJSON.deserialize(parsed);

  console.log('deserialize called', {str, parsed, deserialized});

  if (deserialized.parameters.length > 0) {
    const originalFirstParameter = deserialized.parameters[0];
    if (Array.isArray(originalFirstParameter)) {
      const newFirstParameter = originalFirstParameter.map((item: Binary) => item.buffer);
      console.log('originalFirstParameter', originalFirstParameter);
      console.log('newFirstParameter', newFirstParameter);
      deserialized.parameters[0] = newFirstParameter;
    }
  }

  return deserialized;
};

const serialize = (value: any): string => {
  const serialized = EJSON.serialize(value);
  const stringified = JSON.stringify(serialized);
  console.log('serialize called', {value, serialized, stringified, parameters: serialized.parameters});
  return stringified;
};

const byteaArrayOid = 1001 as TypeId;
const originalByteaArrayParser = pg.types.getTypeParser(byteaArrayOid);
pg.types.setTypeParser(byteaArrayOid, (val: string) => {
  const originalValue = originalByteaArrayParser(val);
  const newValue = originalValue.map((item: Buffer) => new Binary(item));
  console.log({originalValue, newValue});
  return newValue;
});

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

  if (!req.query.q || typeof req.query.q !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const compiledQuery = deserialize(req.query.q);

  console.log('compiledQuery', compiledQuery);

  try {
    const result = await kysely.executeQuery(compiledQuery);
    return res.send(serialize(result));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e });
  }
};