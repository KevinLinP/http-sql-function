import { expect, test, vi } from 'vitest'

process.env.DATABASE_URL = 'postgresql://kevin@localhost:5432/http_sql_test';
process.env.API_KEY = 'test-api-key';

test('should execute SQL and return rows', async () => {
  // dynamically import to ensure env vars are loaded first
  const { httpSql } = await import('./index.js');
  const req = {
    body: {
      sql: 'SELECT 1 as num, \'hello\' as greeting',
      params: [],
      method: 'all',
    },
    headers: {
      authorization: 'Bearer test-api-key',
    },
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  };

  await httpSql(req as any, res as any);

  expect(res.send).toHaveBeenCalledWith([[1, 'hello']]);
});

test('return a 401 if unauthorized', async () => {
  // dynamically import to ensure env vars are loaded first
  const { httpSql } = await import('./index.js');
  const req = {
    body: {
      sql: 'SELECT 1 as num, \'hello\' as greeting',
      params: [],
      method: 'all',
    },
    headers: {
      authorization: 'Bearer wrong-api-key',
    },
  };

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  };

  await httpSql(req as any, res as any);

  expect(res.status).toHaveBeenCalledWith(401);
});
