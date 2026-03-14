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
    // Set CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    return res.status(200).json({
       success: data.status === "success" || mappedResult.length > 0,
       result: mappedResult
    });
  } catch (error) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
