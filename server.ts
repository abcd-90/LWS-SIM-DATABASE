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

      const baseUrl = process.env.SIM_DATABASE_API_URL || "https://blacksimdetail.vercel.app/public_apis/simdetailsapi.php";
      const apiUrl = `${baseUrl}?number=${phone}`;
      
      const response = await axios.get(apiUrl);
      let data = response.data;
      
      // Auto-fetch all SIMs by CNIC if available
      if (data && data.status === "success" && Array.isArray(data.data) && data.data.length > 0) {
         const firstRecord = data.data[0];
         const cnic = firstRecord.CNIC || firstRecord.Cnic;
         
         if (cnic && String(cnic) !== String(phone)) {
             try {
                 const cnicUrl = `${baseUrl}?number=${cnic}`;
                 const cnicResponse = await axios.get(cnicUrl);
                 if (cnicResponse.data && cnicResponse.data.status === "success" && Array.isArray(cnicResponse.data.data)) {
                     // Replace data with CNIC data, which usually has all matching phone numbers
                     data = cnicResponse.data; 
                 }
             } catch (cnicError) {
                 console.error("Failed to fetch CNIC details, falling back to original:", cnicError);
             }
         }
      }
      
      let mappedResult = [];
      if (data && data.status === "success" && Array.isArray(data.data)) {
         mappedResult = data.data.map((item: any) => ({
            name: item.Name || "",
            mobile: item.Mobile || item.Phone || "",
            cnic: item.CNIC || item.Cnic || "",
            address: item.Address || item.Location || ""
         }));
      }

      res.json({
         success: data.status === "success" || mappedResult.length > 0,
         result: mappedResult
      });
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
