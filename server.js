// Persistent TurboWarp Cloud Variable Server for Free Hosts (like Koyeb)
// Saves variables to disk and restores them on restart

import WebSocket, { WebSocketServer } from "ws";
import fs from "fs";
import http from "http";

const port = process.env.PORT || 8080;
const saveFile = "./cloudData.json";

// Load saved cloud variables
let cloudVars = {};
if (fs.existsSync(saveFile)) {
  try {
    cloudVars = JSON.parse(fs.readFileSync(saveFile, "utf8"));
    console.log("✅ Loaded saved cloud data");
  } catch (err) {
    console.error("⚠️ Error loading saved data:", err);
  }
}

// Function to save variables to file
function saveData() {
  fs.writeFileSync(saveFile, JSON.stringify(cloudVars, null, 2));
  console.log("💾 Data saved");
}

// HTTP + WebSocket combined server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("TurboWarp Cloud Variable Server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("👤 New client connected");

  // Send all existing variables
  for (const [name, value] of Object.entries(cloudVars)) {
    ws.send(`set ${name} ${value}`);
  }

  ws.on("message", (msg) => {
    const text = msg.toString();
    const [cmd, name, ...rest] = text.split(" ");
    const value = rest.join(" ");

    if (cmd === "set") {
      cloudVars[name] = value;
      saveData();

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(`set ${name} ${value}`);
        }
      });
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// Keep alive
setInterval(() => {
  console.log("💤 Waiting for connections...");
}, 60000);
