// Persistent TurboWarp Cloud Variable Server for Koyeb Free Tier
// Uses one port for both HTTP + WebSocket

import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";

const port = process.env.PORT || 8080;
const saveFile = "./cloudData.json";

// Load existing data
let cloudVars = {};
if (fs.existsSync(saveFile)) {
  try {
    cloudVars = JSON.parse(fs.readFileSync(saveFile, "utf8"));
    console.log("✅ Loaded saved data");
  } catch {
    console.log("⚠️ Error reading save file, starting fresh");
  }
}

// HTTP server (for Koyeb health checks)
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TurboWarp Cloud Server Active");
});

// Attach WebSocket to same server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("👤 New connection");

  // Send stored variables
  for (const [name, value] of Object.entries(cloudVars)) {
    ws.send(`set ${name} ${value}`);
  }

  ws.on("message", (msg) => {
    const text = msg.toString();
    const [cmd, name, ...rest] = text.split(" ");
    const value = rest.join(" ");

    if (cmd === "set") {
      cloudVars[name] = value;
      fs.writeFileSync(saveFile, JSON.stringify(cloudVars, null, 2));

      // Broadcast
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(`set ${name} ${value}`);
        }
      });
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

server.listen(port, () => console.log(`🚀 Server running on ${port}`));

// Keep alive
setInterval(() => console.log("💤 Idle, waiting for connections..."), 60000);
