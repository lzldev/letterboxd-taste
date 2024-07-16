# Letterboxd Taste Profile


## Deploying

### Requirements
 - PostgresDB
    - with [`pgvector`](https://github.com/pgvector/pgvector) extension enabled.
 - Supabase Account ( for realtime notifications )

## Running locally:

1. `pnpm install`
0. Fill the `.env` file (Check the [`example env`](./.env.example))
0. `pnpm db:seed`
0. `pnpm dev`
