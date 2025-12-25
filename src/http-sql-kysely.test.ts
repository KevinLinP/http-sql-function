import { expect, test } from 'vitest'
import { EJSON, Binary } from 'bson';
import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type Generated } from "kysely";

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

interface TestTable {
  id: Generated<number>
  binary: Binary
}

interface Database {
  test: TestTable
}

const dbFetch = new Kysely<Database>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => new DummyDriver()
  },
});
