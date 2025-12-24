CREATE TABLE kysely_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binary_array BYTEA[] NOT NULL
);

