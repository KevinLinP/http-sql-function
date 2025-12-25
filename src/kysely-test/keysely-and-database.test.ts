import { expect, test } from 'vitest'
import { EJSON, Binary } from 'bson';
import { DummyDriver, Kysely, PostgresAdapter, PostgresDialect, PostgresIntrospector, PostgresQueryCompiler, type Generated } from "kysely";
import * as pg from 'pg';

const transformer = {
  serialize: (value: any): string => {
    const serialized = EJSON.serialize(value);
    return JSON.stringify(serialized);
  },
  deserialize: (str: string): any => {
    const parsed = JSON.parse(str);
    return EJSON.deserialize(parsed);
  },
};

interface KyselyTestTable {
  id: Generated<string>
  binary: Binary[]
}

interface Database {
  kysely_tests: KyselyTestTable
}

const browserKysely = new Kysely<Database>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => new DummyDriver()
  },
});

const cloudFunctionKysely = new Kysely({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Keep it low for Cloud Functions
    })
  }),
});

test('EJSON and database', async () => {
  const outgoingInsert = browserKysely.insertInto('kysely_tests').values({
    binary: [new Binary(Buffer.from('hello', 'utf-8')), new Binary(Buffer.from('world', 'utf-8'))],
  }).compile();
  const outgoingInsertString = transformer.serialize(outgoingInsert);

  const incomingInsert = transformer.deserialize(outgoingInsertString);
  console.log(incomingInsert);

});
