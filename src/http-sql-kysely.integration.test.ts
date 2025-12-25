import { Kysely, type Generated } from "kysely";
import { FetchDriver } from "./kysely-test/fetch-driver.js";
import { PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import { Binary, EJSON } from 'bson';
import { expect, test } from 'vitest'

interface KyselyTestsTable {
  id: Generated<string>
  binary_array: Binary[]
}

interface Database {
  kysely_tests: KyselyTestsTable
}

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

const dbFetch = () => {
  return new Kysely<Database>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
      createDriver: () => {
        return new FetchDriver({
          transformer,
          url: "http://localhost:8080/",
          init: {
            headers: {
              Authorization: `Bearer test-api-key`,
            },
          },
        });
      },
    },
  });
}

test('should insert and select binary data', async () => {
  const result = await dbFetch().insertInto("kysely_tests").values({
    binary_array: [new Binary(new Uint8Array([1, 2, 3])), new Binary(new Uint8Array([4, 5, 6]))],
  }).returning('id').executeTakeFirst();

  const id = result?.id;
  if (!id) {
    throw new Error('Id is undefined');
  }

  //use kysely query builder as normal
  const examples = await dbFetch()
    .selectFrom("kysely_tests")
    .selectAll()
    .where('id', '=', id)
    .execute();

  console.log({examples});

  expect(examples[0]?.binary_array).toEqual([new Binary(new Uint8Array([1, 2, 3])), new Binary(new Uint8Array([4, 5, 6]))]);
  }
);