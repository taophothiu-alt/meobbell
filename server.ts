
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSONBin Config
const JSONBIN_SECRET = process.env.JSONBIN_SECRET;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Ensure data directory exists (for local fallback)
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const vocabFile = path.join(dataDir, "vocab.json");
  if (!fs.existsSync(vocabFile)) {
    fs.writeFileSync(vocabFile, JSON.stringify([]));
  }

  // Helper: Read Data
  const readVocabData = async () => {
    // 1. Try JSONBin if configured
    if (JSONBIN_SECRET && JSONBIN_BIN_ID) {
      try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
          headers: { 'X-Master-Key': JSONBIN_SECRET }
        });
        if (res.ok) {
          const json = await res.json() as any;
          return json.record || [];
        } else {
          console.error("JSONBin Read Error:", await res.text());
        }
      } catch (e) {
        console.error("JSONBin Connection Error:", e);
      }
    }

    // 2. Fallback to Local File
    try {
      if (fs.existsSync(vocabFile)) {
        const data = fs.readFileSync(vocabFile, "utf-8");
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Local File Read Error:", e);
    }
    return [];
  };

  // Helper: Write Data
  const writeVocabData = async (data: any) => {
    // 1. Try JSONBin if configured
    if (JSONBIN_SECRET && JSONBIN_BIN_ID) {
      try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_SECRET
          },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          console.error("JSONBin Write Error:", await res.text());
          throw new Error("Failed to sync to Cloud");
        }
        return; // Success
      } catch (e) {
        console.error("JSONBin Connection Error:", e);
        // Don't return here, fall through to local save as backup
      }
    }

    // 2. Fallback to Local File
    fs.writeFileSync(vocabFile, JSON.stringify(data, null, 2));
  };

  // API Routes
  app.get("/api/vocab", async (_req, res) => {
    try {
      const data = await readVocabData();
      res.json(data);
    } catch (error) {
      console.error("Error reading vocab:", error);
      res.status(500).json({ error: "Failed to read vocab data" });
    }
  });

  app.post("/api/vocab", async (req, res) => {
    try {
      const vocabData = req.body;
      await writeVocabData(vocabData);
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
    if (JSONBIN_SECRET && JSONBIN_BIN_ID) {
      console.log("✅ Cloud Sync Enabled (JSONBin)");
    } else {
      console.log("⚠️ Running in Local Mode. Data will not sync across devices.");
    }
  });
}

startServer();
