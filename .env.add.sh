#!/bin/bash
# Add DATABASE_URL to .env.local if not already present
if ! grep -q "DATABASE_URL=" .env.local 2>/dev/null; then
  echo "" >> .env.local
  echo "DATABASE_URL=\"postgresql://neondb_owner:npg_Jn7wypl6ZaYs@ep-little-shape-ahlstuay-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require\"" >> .env.local
  echo "✅ DATABASE_URL added to .env.local"
else
  echo "✅ DATABASE_URL already exists in .env.local"
fi
