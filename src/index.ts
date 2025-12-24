import type { HttpFunction } from '@google-cloud/functions-framework';
import { Pool } from 'pg';
import { EJSON } from 'bson';

export { httpSqlKysely } from './http-sql-kysely.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Keep it low for Cloud Functions
});

export const httpSql: HttpFunction = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sql, params, method } = req.body;
  // prevent multiple queries
  const sqlBody = sql.replace(/;/g, '');

  try {
    const result = await pool.query({
      text: sqlBody,
      values: EJSON.deserialize(params),
      ...(method === 'all' && { rowMode: 'array' }),
    });
    const ejsonResult = EJSON.serialize(result.rows);

    return res.send(ejsonResult);
  } catch (e: any) {
    return res.status(500).json({ error: e });
  }
};