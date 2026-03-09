import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy Route
  // Isse aapka asli API URL frontend se chup jayega
  app.get("/api/lookup", async (req, res) => {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
      }

      // Asli API URL environment variable se lein ya fallback use karein
      const baseUrl = process.env.SIM_DATABASE_API_URL || "https://howler-database-api.vercel.app/api/lookup";
      const apiUrl = `${baseUrl}?phone=${phone}`;
      
      const response = await axios.get(apiUrl);
      res.json(response.data);
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
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
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
