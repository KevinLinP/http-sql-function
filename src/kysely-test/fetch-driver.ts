// from https://github.com/andersgee/kysely-fetch-driver

import type {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  QueryResult,
} from "kysely";

export interface FetchDriverConfig {
  url: string;
  init?: RequestInit;
  transformer: {
    serialize: (value: any) => string;
    deserialize: (str: string) => any;
  };
}

export class FetchDriver implements Driver {
  config: FetchDriverConfig;

  constructor(config: FetchDriverConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    // Nothing to do here.
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new FetchConnection(this.config);
  }

  async beginTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async commitTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async rollbackTransaction(): Promise<void> {
    // Nothing to do here.
  }

  async releaseConnection(): Promise<void> {
    // Nothing to do here.
  }

  async destroy(): Promise<void> {
    // Nothing to do here.
  }
}

class FetchConnection implements DatabaseConnection {
  config: FetchDriverConfig;

  constructor(config: FetchDriverConfig) {
    this.config = config;
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("FetchConnection does not support streaming");
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const body = this.config.transformer.serialize({
      sql: compiledQuery.sql,
      parameters: compiledQuery.parameters,
    });

    console.log({body});

    const url = this.config.url;
    const res = await fetch(url, {
      ...this.config.init,
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'text/plain',
        ...this.config.init?.headers,
      },
    });

    if (res.ok) {
      try {
        const text = await res.text();
        console.log({text});
        const result = this.config.transformer.deserialize(
          text
        ) as QueryResult<R>;
        return result;
      } catch (error) {
        console.log({error});
        throw new Error("failed to parse response");
      }
    } else {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  }
}
