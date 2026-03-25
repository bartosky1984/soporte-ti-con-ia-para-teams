
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function checkRest() {
  if (!apiKey) {
    console.error("❌ No API Key");
    return;
  }

  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`📡 Checking REST API for ${model}...`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`✅ Success with REST!`);
    } else {
      console.log(`❌ REST Failed (${response.status}):`, JSON.stringify(data));
    }
  } catch (e) {
    console.error("❌ Fetch Error:", e.message);
  }

  // Try listing models
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  console.log(`📡 Attempting to list models via REST...`);
  try {
    const response = await fetch(listUrl);
    const data = await response.json();
    if (response.ok) {
        console.log("✅ Models found:", data.models?.map(m => m.name));
    } else {
        console.log(`❌ List Failed (${response.status}):`, JSON.stringify(data));
    }
  } catch (e) {
      console.error("❌ List Fetch Error:", e.message);
  }
}

checkRest();
