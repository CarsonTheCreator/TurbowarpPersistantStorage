// Persistent TurboWarp Cloud Variable Server for Free Hosts (like Koyeb)
// Saves variables to disk and restores them on restart

import WebSocket, { WebSocketServer } from "ws";
import fs from "fs";
import http from "http";

const port = process.env.PORT || 8080;
const saveFile = "./cloudData.json";

// Simple web server so Koyeb can ping it
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(port, () => {
  console.log("HTTP server running on port", port);
});

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

// Start WebSocket server
const wss = new WebSocketServer({ noServer: true });

// When a client connects
function handleConnection(ws) {
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
}

// Upgrade HTTP connections to WebSocket
const server = http.createServer();
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleConnection(ws);
  });
});
server.listen(8081, () => {
  console.log("🔌 WebSocket server running on port 8081");
});

// Keep-alive log (optional)
setInterval(() => {
  console.log("💤 Waiting for connections...");
}, 60000);
