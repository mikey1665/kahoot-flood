import {useCallback, useEffect, useMemo, useState} from "react";
import './App.css';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import particlesOptions from "./assets/particles.json";
import { ISourceOptions } from "@tsparticles/engine";

function App() {
    const [init, setInit] = useState(false);
    const [pin, setPin] = useState("");
    const [amount, setAmount] = useState(10);
    const [logs, setLogs] = useState<string[]>([]);

    const memoizedParticlesOptions = useMemo(() => particlesOptions as unknown as ISourceOptions, []);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
    }, []);

    const MemoizedParticles = useMemo(() => (
        init ? <Particles options={memoizedParticlesOptions} /> : null
    ), [init, memoizedParticlesOptions]);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadFull(engine);
        }).then(() => {
            setInit(true);
        });
    }, [addLog]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLog(`Starting flood with PIN: ${pin} and ${amount} bots`);

        const socket = new WebSocket("ws://localhost:3001");

        socket.onopen = () => {
            const message = {
                gamePin: pin,
                botCount: amount,
                baseName: "EpicBot"
            };
            socket.send(JSON.stringify(message));
            addLog("Sent bot request to server.");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.success && data.name && !data.status) {
                // Bot successfully joined
                addLog(`✅ ${data.name} joined.`);
            } else if (data.success && data.status) {
                // Other success events (e.g., Quiz started, Answering)
                addLog(`ℹ️ ${data.name}: ${data.status}`);
            } else if (!data.success && data.status) {
                // Status message with success false (like "Quiz ended")
                addLog(`⚠️ ${data.name}: ${data.status}`);
            } else if (!data.success && data.error) {
                // Error occurred
                addLog(`❌ Error: ${data.error}`);
            } else {
                // Fallback for unexpected format
                addLog(`❓ Unknown response: ${event.data}`);
            }
        };

        socket.onerror = (err) => {
            addLog("❌ WebSocket error occurred.");
            console.error("WebSocket error:", err);
        };

        socket.onclose = () => {
            addLog("🔌 WebSocket connection closed.");
        };
    };

    return (
        <div className="App">
            {MemoizedParticles}
            <header className="App-header">
                <h1>Kahoot Flooder</h1>

                <form onSubmit={handleSubmit} className="input-container">
                    <div className="input-group">
                        <label htmlFor="game-pin">Game PIN</label>
                        <input
                            id="game-pin"
                            type="text"
                            placeholder="Enter game PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="styled-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="amount">Bots Amount</label>
                        <input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            min="1"
                            max="100"
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="styled-input"
                            required
                        />
                    </div>

                    <button type="submit" className="submit-button">
                        Start Flood
                    </button>
                </form>

                <div className="console-container">
                    <div className="console-header">
                        <h3>Activity Log</h3>
                        <button
                            onClick={() => setLogs([])}
                            className="clear-button"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="console-output">
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <div key={index} className="log-entry">
                                    {log}
                                </div>
                            ))
                        ) : (
                            <div className="log-entry empty">No activity yet</div>
                        )}
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
