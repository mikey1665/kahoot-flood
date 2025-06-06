const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Kahoot = require('kahoot.js-latest');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve React frontend (after you build it)
app.use(express.static('client/dist')); // or build, depending on your setup

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
        try {
            const { gamePin, botCount = 1, baseName = "Skibidi" } = JSON.parse(message.toString());

            for (let i = 0; i < botCount; i++) {

                //Handle our bot here
                const client = new Kahoot();
                const botName = `${baseName}${Math.floor(Math.random() * 10000)}`;

                client.join(gamePin, botName)
                    .then(() => {
                        console.log(`✅ [${botName}] joined game ${gamePin}`);
                        ws.send(JSON.stringify({ success: true, name: botName }));
                    })
                    .catch((err) => {
                        console.error(`❌ [${botName}] Failed to join: ${err.message}`);
                        ws.send(JSON.stringify({ success: false, error: err.message }));
                    });

                client.on("QuizStart", () => {
                    console.log(`🎮 [${botName}] Quiz started!`);
                    ws.send(JSON.stringify({ success: true, status: "Quiz started", name: botName }));
                });

                client.on("QuestionStart", (question) => {
                    console.log(`❓ [${botName}] Answering...`);
                    question.answer(0); // Always pick first option for now. randomize in future or select correct answer.
                    ws.send(JSON.stringify({ success: true, status: "Answering...", name: botName }));
                });

                client.on("QuizEnd", () => {
                    console.log(`🏁 [${botName}] Quiz ended.`);
                    ws.send(JSON.stringify({ success: false, status: "Quiz ended", name: botName }));
                });

                // Delay before next bot joins
                await new Promise((res) => setTimeout(res, 200));
            }
        } catch (err) {
            console.error("❌ Invalid message received:", err);
            ws.send(JSON.stringify({ success: false, error: "Invalid message format" }));
        }
    });

    ws.on('close', () => {
        console.log("🔌 Client disconnected.");
    });
});

server.listen(3001, () => {
    console.log('Server listening on http://localhost:3001');
});
