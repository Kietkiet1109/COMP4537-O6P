const express = require('express');
const path = require('path');
const net = require('net');
const WebSocket = require('ws');
const http = require('http');
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const app_port = process.env.APP_PORT || 3000
const server_port = process.env.SERVER_PORT || 3003

// View Engine (optional, if you still use EJS templates)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cross-Origin headers (for features like audio processing)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
});

// Middleware to parse requests and serve frontend files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

// Route
app.use('/', require('./public/js/home'));

// 404 fallback
app.get('*', (req, res) => res.status(404).render('404'));

// Connect to the EV3 server
const ev3Client = new net.Socket();
ev3Client.connect(process.env.EV3_PORT, process.env.EV3_HOST, () => {
    console.log(`Connected to EV3 at ${process.env.EV3_HOST}:${process.env.EV3_PORT}`);
});

ev3Client.on('error', (err) => {
    console.error('EV3 connection error:', err.message);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log("Web client connected");

    // Handle messages from the web client
    ws.on('message', (message) => {
        console.log("Received from web client:", message);
        ev3Client.write(message);
    });

    // Receive data from EV3 and forward to the web client
    ev3Client.on('data', (data) => {
        console.log("Received from EV3:", data.toString());
        ws.send(data.toString());
    });

    // Handle WebSocket disconnection
    ws.on('close', () => {
        console.log("Web client disconnected");
    });
});

// Start server
app.listen(app_port, () => console.log(`Client running at http://localhost:${app_port}`));
server.listen(server_port, () => console.log(`WebSocket server running at ws://localhost:${server_port}`));
