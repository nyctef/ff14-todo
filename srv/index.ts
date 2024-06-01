import express, { Express, Request, Response } from "express";
import { todos } from "./api";

const app = express();
app.use(express.static("../web/dist"));

app.get("/api/todos", (req: Request, res: Response) => {
  res.json(todos);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
