const express = require("express");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// Load or initialize persistent data
let cloudData = {};
if (fs.existsSync(DATA_FILE)) {
  cloudData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// Save data every 10 seconds
setInterval(() => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cloudData, null, 2));
}, 10000);

app.get("/", (req, res) => {
  res.send("TurboWarp Cloud Server is running ✅");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      const { type, name, value } = data;

      if (type === "get") {
        ws.send(JSON.stringify({ type: "update", name, value: cloudData[name] || 0 }));
      }

      if (type === "set") {
        cloudData[name] = value;
        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: "update", name, value }));
          }
        });
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });
});
