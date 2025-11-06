const fetch = require("node-fetch");

const URL = process.env.SERVER_URL || "https://your-koyeb-app-url.koyeb.app/";

setInterval(async () => {
  try {
    const res = await fetch(URL);
    console.log(`Pinged ${URL} - status: ${res.status}`);
  } catch (err) {
    console.error("Ping failed:", err);
  }
}, 180000); // every 3 minutes
