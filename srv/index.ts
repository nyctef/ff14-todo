import express, { Express, NextFunction, Request, Response } from "express";
import { asyncHandler } from "./util";
import { HttpError } from "./error";
import { EventSourcedApi, PostgresEventStorage } from "./postgresEventStoreApi";
import { setupAuth } from "./auth";
import cookieParser from "cookie-parser";

const api = PostgresEventStorage.create_from_env().then((s) =>
  EventSourcedApi.create(s)
);

let workosEnvVars = {
  clientId: process.env.WORKOS_CLIENT_ID,
  apiKey: process.env.WORKOS_API_KEY,
  cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
};

// console.log({ workosEnvVars });

const app = express();
app.use(cookieParser());

if (
  workosEnvVars.apiKey &&
  workosEnvVars.clientId &&
  workosEnvVars.cookiePassword
) {
  setupAuth(app, {
    apiKey: workosEnvVars.apiKey,
    clientId: workosEnvVars.clientId,
    cookiePassword: workosEnvVars.cookiePassword,
  });
}

const staticDir = app.get("env") !== "development" ? "./web" : "../web/dist";
app.use(express.static(staticDir));
app.use(express.json());

app.get(
  "/api/todos",
  asyncHandler(async (req, res, next) => {
    console.log("GET /api/todos");
    // TODO: is there a nicer way to access this api object
    // without needing a nested await?
    //
    // would like to do a top-level await to get stuff set up
    // in the outer scope, but attempting that produces a whole
    // can of worms with js module systems and changing stuff
    // to allow top-level awaits.
    //
    // maybe push this into a middleware that can use a pg
    // connection pool to have per-request connections so that
    // the connection breaking can get auto-fixed?
    res.json(await (await api).getTodos().catch(next));
  })
);

app.post(
  "/api/todos",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos");
    const toCreate = req.body;

    // TODO: validate request body using io-ts or something
    const todo = await (await api).addTodo(toCreate);

    res.status(201).json(todo);
  })
);

app.post(
  "/api/todos/:id/completed",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos/:id/completed");
    const id = parseInt(req.params.id, 10);
    const completed = req.body.completed;

    await (await api).setTodoCompleted(id, completed);

    res.sendStatus(204);
  })
);

app.post(
  "/api/todos/:id/name",
  asyncHandler(async (req, res) => {
    console.log("POST /api/todos/:id/name");
    const id = parseInt(req.params.id, 10);
    const text = req.body.text;

    await (await api).renameTodo(id, text);

    res.sendStatus(204);
  })
);

app.delete(
  "/api/todos/:id",
  asyncHandler(async (req, res) => {
    console.log("DELETE /api/todos/:id");
    const id = parseInt(req.params.id, 10);

    await (await api).removeTodo(id);

    res.sendStatus(204);
  })
);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // https://expressjs.com/en/guide/error-handling.html
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith("/api") && err instanceof HttpError) {
    console.error(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  return next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
