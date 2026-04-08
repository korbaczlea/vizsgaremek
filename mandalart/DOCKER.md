# Docker setup

## Prerequisites

- Docker Desktop installed and running

## Start the project

```bash
docker compose up --build
```

## Open the app

- Frontend: `http://localhost:8080`

## Services

- `web` (Nginx): serves React build and proxies `/api/*` to backend
- `backend` (PHP 8.2 + Apache): serves API routes from `backend/index.php`
- `db` (MySQL 8): initializes from `mandalart (1).sql`
  and `backend/sql/stored_procedures.sql`

## Useful commands

```bash
# Stop and remove containers
docker compose down

# Stop + remove containers + database volume (fresh DB import on next up)
docker compose down -v
```
