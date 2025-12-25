import { expect, test } from 'vitest'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://kevin@localhost:5432/http_sql_test',
})

test('pg library: insert and read binary_array', async () => {
  // Create two binary buffers
  const binary1 = Buffer.from('hello', 'utf-8')
  const binary2 = Buffer.from('world', 'utf-8')
  const binaryArray = [binary1, binary2]

  // Insert a row with binary_array
  const insertResult = await pool.query(
    'INSERT INTO kysely_tests (binary_array) VALUES ($1) RETURNING id',
    [binaryArray]
  )
  
  const insertedId = insertResult.rows[0].id
  expect(insertedId).toBeDefined()

  // Select the row back
  const selectResult = await pool.query(
    'SELECT binary_array FROM kysely_tests WHERE id = $1',
    [insertedId]
  )

  const retrievedBinaryArray = selectResult.rows[0].binary_array
  expect(retrievedBinaryArray).toBeDefined()
  expect(retrievedBinaryArray).toHaveLength(2)

  // Check if binary_array values match
  expect(Buffer.compare(retrievedBinaryArray[0], binary1)).toBe(0)
  expect(Buffer.compare(retrievedBinaryArray[1], binary2)).toBe(0)

  // Cleanup
  await pool.query('DELETE FROM kysely_tests WHERE id = $1', [insertedId])
  
  await pool.end()
})

