import express from "express";
import cors from "cors";
import identifyRoute from "./routes/identify.route";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Bitespeed Identity Service Running 🚀");
});

app.use("/identify", identifyRoute);

export default app;