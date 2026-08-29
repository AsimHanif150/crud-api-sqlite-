# Task API

A small in-memory CRUD API for managing a to-do list. Built with Node.js and Express as part of the FlyRank Backend Internship, Week 2, Assignment A1.

## What this is

A REST API that lets you create, read, update, and delete tasks. Data is stored in memory (a JavaScript array) — it resets whenever the server restarts. There is no database yet; that's next week.

## How to install & run

```bash
npm install
npm start
```

The server starts at `http://localhost:3000`. Interactive docs (Swagger UI) are at `http://localhost:3000/docs`.

## Endpoints

| Method | Path         | Description                | Success | Errors        |
|--------|--------------|-----------------------------|---------|----------------|
| GET    | /            | API info                    | 200     | —              |
| GET    | /health      | Health check                | 200     | —              |
| GET    | /tasks       | List all tasks              | 200     | —              |
| GET    | /tasks/:id   | Get a single task           | 200     | 404            |
| POST   | /tasks       | Create a task                | 201     | 400 (bad title)|
| PUT    | /tasks/:id   | Update a task's title/done  | 200     | 400, 404       |
| DELETE | /tasks/:id   | Delete a task                | 204     | 404            |

## Example: curl output

```
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'

HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}
```

## Swagger screenshot

_(Add your screenshot of `http://localhost:3000/docs` here once you've run it locally.)_

## The mortality experiment

_(Create a few tasks, restart the server with `npm start`, then `GET /tasks` again. Write two sentences here about what you observe and why — this is the whole reason in-memory storage matters.)_
