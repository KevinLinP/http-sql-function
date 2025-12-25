import { Kysely, type Generated } from "kysely";
import { FetchDriver } from "./kysely-test/fetch-driver.js";
import { PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import superjson, { type SuperJSONResult } from 'superjson';
import { expect, test } from 'vitest'

interface KyselyTestsTable {
  id: Generated<string>
  binary_array: Uint8Array[]
}

interface Database {
  kysely_tests: KyselyTestsTable
}

superjson.registerCustom<Uint8Array, string>(
  {
    isApplicable: (v): v is Uint8Array => v instanceof Uint8Array,
    deserialize: v => Uint8Array.from(atob(v), c => c.charCodeAt(0)),
    serialize: v => btoa(String.fromCharCode(...v)),
  },
  'binary'
);

const transformer = {
  serialize: (value: any): string => {
    const output = superjson.stringify(value);
    console.log({output});
    return output;
  },
  deserialize: (str: string): any => {
    console.log({str});
    const parsed = superjson.parse(str);
    console.log({parsed});
    return parsed;
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
    binary_array: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
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

  expect(examples[0]?.binary_array).toEqual([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
  }
);