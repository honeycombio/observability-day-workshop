# Shared Data

This directory contains shared data used by multiple services in the Meminator application.

## SQLite Databases

This directory contains the following SQLite databases:

1. `users.db` - Contains user information used by the user services
2. `phrases.db` - Contains phrases used by the phrase-picker services

## Initialization

To initialize the databases, run one of the following commands:

```bash
# Initialize users database using Node.js
npm install
npm run init-db

# Initialize users database using Python
pip install sqlite3
npm run init-db-py

# Initialize phrases database using Node.js
npm run init-phrases-db

# Initialize phrases database using Python
npm run init-phrases-db-py
```

## Database Schemas

### Users Database (`users.db`)

#### Users Table

| Column    | Type | Description                    |
| --------- | ---- | ------------------------------ |
| id        | TEXT | Primary key                    |
| name      | TEXT | User's name                    |
| avatarUrl | TEXT | URL to the user's avatar image |

### Phrases Database (`phrases.db`)

#### Phrases Table

| Column | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| id     | INTEGER | Primary key (auto increment) |
| text   | TEXT    | The phrase text              |
