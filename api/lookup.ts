import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Asli API URL environment variable se lein ya fallback use karein
    const baseUrl = process.env.SIM_DATABASE_API_URL || "https://howler-database-api.vercel.app/api/lookup";
    const apiUrl = `${baseUrl}?phone=${phone}`;
    
    const response = await axios.get(apiUrl);
    
    // Set CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
