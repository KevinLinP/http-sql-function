#!/bin/bash

if [ -z "$DATABASE_URL" ] || [ -z "$API_KEY" ]; then
  echo "Error: DATABASE_URL and API_KEY environment variables must be set"
  exit 1
fi

gcloud functions deploy http-sql \
  --entry-point=httpSql \
  --gen2 \
  --region=us-central1 \
  --runtime=nodejs24 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="${DATABASE_URL}",API_KEY="${API_KEY}"