// websocket.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('A new client connected');

  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
});

function notifyUser(postId, message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ postId, message }));
    }
  });
}

module.exports = { notifyUser };
