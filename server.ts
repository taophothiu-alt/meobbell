import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increase limit for large vocab uploads

  // Ensure data directory exists
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const vocabFile = path.join(dataDir, "vocab.json");
  if (!fs.existsSync(vocabFile)) {
    fs.writeFileSync(vocabFile, JSON.stringify([]));
  }

  // API Routes
  app.get("/api/vocab", (_req, res) => {
    try {
      if (fs.existsSync(vocabFile)) {
        const data = fs.readFileSync(vocabFile, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error reading vocab:", error);
      res.status(500).json({ error: "Failed to read vocab data" });
    }
  });

  app.post("/api/vocab", (req, res) => {
    try {
      const vocabData = req.body;
      fs.writeFileSync(vocabFile, JSON.stringify(vocabData, null, 2));
      res.json({ success: true, message: "Vocab saved successfully" });
    } catch (error) {
      console.error("Error saving vocab:", error);
      res.status(500).json({ error: "Failed to save vocab data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
