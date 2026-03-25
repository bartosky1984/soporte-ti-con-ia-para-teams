
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function diagnose() {
  if (!apiKey) {
    console.error("❌ No API Key found in .env");
    return;
  }

  console.log("🔍 Checking API Key:", apiKey.substring(0, 5) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("📡 Attempting to list models...");
    // Some versions of the SDK don't have listModels on the main class
    // We'll try to fetch it via the base URL if needed, but let's try a known simple model first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("✅ Success with gemini-1.5-flash!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("❌ Flash failed:", error.message);
    
    try {
        console.log("📡 Attempting gemini-pro (v1.0)...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hi");
        console.log("✅ Success with gemini-pro!");
    } catch (e2) {
        console.error("❌ Gemini-pro failed:", e2.message);
    }
  }
}

diagnose();
