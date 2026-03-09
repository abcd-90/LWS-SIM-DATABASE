import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const cache = new Map<string, string[]>();

export async function normalizeAddress(rawAddress: string): Promise<string[]> {
  if (!rawAddress || rawAddress.length < 3) return [rawAddress];
  
  const trimmedAddress = rawAddress.trim();
  if (cache.has(trimmedAddress)) {
    return cache.get(trimmedAddress)!;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        parts: [{
          text: `You are an expert in Pakistani geography and addresses. 
          Given the following raw, potentially messy address from a database, provide a list of 3 geocoding queries in order of decreasing specificity.
          
          Pakistani addresses often contain:
          - "P/O" or "Post Office"
          - "Tehsil" or "Teshil"
          - "Distt" or "District"
          - "Mohalla" or "Muhalla"
          - "Chak No" or "Village"
          - "House No" or "Street No"
          
          Please clean these up and format them for OpenStreetMap/Google Maps.
          
          Queries to provide:
          1. The most specific location (House/Street, Area, City, Province, Pakistan).
          2. A broader area-level location (Area, City, Province, Pakistan).
          3. Just the city-level location (City, Province, Pakistan).
          
          Raw Address: "${trimmedAddress}"
          
          Return the queries as a JSON array of strings. ONLY return the JSON array. No explanations.`
        }]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text?.trim() || "[]";
    
    // Handle case where Gemini returns "undefined" as a string or other non-JSON
    if (text === "undefined" || text === "null" || !text) {
      text = "[]";
    }

    // Strip markdown code blocks if present
    if (text.startsWith("```")) {
      text = text.replace(/^```json\n?/, "").replace(/```$/, "").trim();
    }

    try {
      const queries = JSON.parse(text);
      if (Array.isArray(queries) && queries.length > 0) {
        cache.set(trimmedAddress, queries);
        return queries;
      }
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", text);
    }
    
    const fallback = [trimmedAddress + ", Pakistan"];
    cache.set(trimmedAddress, fallback);
    return fallback;
  } catch (error: any) {
    // If rate limited, return a sensible default without caching (so we can try again later)
    console.error("Address normalization error:", error);
    
    // Check if it's a rate limit error
    if (error?.message?.includes("429") || error?.status === 429) {
      console.warn("Gemini rate limit hit, using fallback.");
    }
    
    return [trimmedAddress + ", Pakistan"];
  }
}
