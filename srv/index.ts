import express, { Express, Request, Response } from "express";

const app = express();
app.use(express.static("../web/dist"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
