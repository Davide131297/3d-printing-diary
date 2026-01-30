import express, { json } from "express";
import cors from "cors";
import { scrapeMakerWorld } from "./scraper.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3001;

app.use(
  cors({
    origin: "*", // Temporär: Alle erlauben
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.use(json());

const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = process.env.BACKEND_TOKEN;

  if (!token) {
    console.warn("BACKEND_TOKEN is not defined in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ") ||
    authHeader.split(" ")[1] !== token
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.get("/", (req, res) => {
  res.json({
    message: "3D-Printing Backend läuft!",
  });
});

app.post("/scrape", checkAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    console.log("Scraping URL:", url);
    const data = await scrapeMakerWorld(url);
    if (!data) {
      return res.status(500).json({ error: "Failed to scrape data" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
