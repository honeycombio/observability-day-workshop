# Shared Data

This directory contains shared data used by multiple services in the Meminator application.

## SQLite Database

The `users.db` file is a SQLite database that contains user information used by both the Node.js and Python user services.

## Initialization

To initialize the database, run one of the following commands:

```bash
# Using Node.js
npm install
npm run init-db

# Using Python
pip install sqlite3
npm run init-db-py
```

## Database Schema

The database contains a single table:

### Users Table

| Column    | Type | Description                   |
|-----------|------|-------------------------------|
| id        | TEXT | Primary key                   |
| name      | TEXT | User's name                   |
| avatarUrl | TEXT | URL to the user's avatar image|
