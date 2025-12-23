#!/bin/bash

SQL_QUERY="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"

curl -X POST "http://localhost:8080" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"sql\": \"$SQL_QUERY\",
    \"params\": []
  }" \
  | jq '.' 2>/dev/null || cat