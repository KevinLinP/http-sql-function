import { Kysely, type Generated } from "kysely";
import { FetchDriver } from "./kysely-test/fetch-driver-modified.js";
import { PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import superjson from 'superjson';
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
    deserialize: (string: string): Uint8Array => Uint8Array.from(atob(string), c => c.charCodeAt(0)),
    serialize: (array: Uint8Array): string => {
      // Build binary string in chunks to avoid call stack issues with large arrays
      let binaryString = '';
      for (let i = 0; i < array.length; i++) {
        binaryString += String.fromCharCode(array[i]!);
      }
      return btoa(binaryString);
    },
  },
  'binary'
);

const transformer = {
  serialize: (value: any): string => {
    return superjson.stringify(value);
  },
  deserialize: (str: string): any => {
    return superjson.parse(str);
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
            method: 'POST',
            headers: {
              Authorization: `Bearer test-api-key`,
              'Content-Type': 'text/plain',
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

  const examples = await dbFetch()
    .selectFrom("kysely_tests")
    .selectAll()
    .where('id', '=', id)
    .execute();

  expect(examples[0]?.binary_array).toEqual([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
});