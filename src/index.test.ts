import { expect, test, vi, beforeEach } from 'vitest'
import type { HttpFunction } from '@google-cloud/functions-framework';

let httpSql: HttpFunction;

beforeEach(async () => {
  process.env.DATABASE_URL = 'postgresql://kevin@localhost:5432/http_sql_test';
  process.env.API_KEY = 'test-api-key';

  // dynamically import to ensure env vars are loaded first
  const module = await import('./index.js');
  httpSql = module.httpSql;
});

const mockRequest = () => ({
  body: {
    sql: 'SELECT 1 as num, \'hello\' as greeting',
    params: [],
    method: 'all',
  },
  headers: {
    authorization: 'Bearer test-api-key',
  },
});

const mockResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
  send: vi.fn(),
});

test('should execute SQL and return rows', async () => {
  const request = mockRequest();
  const response = mockResponse();

  await httpSql(request as any, response as any);

  expect(response.send).toHaveBeenCalledWith([[1, 'hello']]);
});

test('return a 401 if unauthorized', async () => {
  const request = mockRequest();
  request.headers.authorization = 'Bearer wrong-api-key';
  const response = mockResponse();

  await httpSql(request as any, response as any);

  expect(response.status).toHaveBeenCalledWith(401);
});
