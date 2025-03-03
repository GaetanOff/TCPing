import net from "net";
import chalk from "chalk";
import { getProtocolModule } from "./protocol/protocols.js";
import { validateIp, validatePort } from "./utils/validators.js";
import { sendHelpMessage, sendStatisticsMessage } from "./utils/messages.js";

const args = process.argv.slice(2);
if (args.length < 2) {
    sendHelpMessage();
    process.exit(1);
}

const [target, port, protocolInput] = args;

if (!validateIp(target)) {
    console.log(chalk.red(`Invalid IP address: "${target}"`));
    process.exit(1);
}

if (!validatePort(port)) {
    console.log(chalk.red(`Invalid port: "${port}". Please enter a port number between 1 and 65535.`));
    process.exit(1);
}

const protocolModule = getProtocolModule(protocolInput, chalk);

// Statistics variables
let totalAttempts = 0;
let successfulAttempts = 0;
let failedAttempts = 0;
let totalSocketLatency = 0; // Sum of socket connection times
let totalHandshakeLatency = 0; // Sum of handshake times (for non-basic protocols)
let minSocketLatency = Infinity;
let maxSocketLatency = 0;

// Capture CTRL+C to print statistics before exiting
process.on("SIGINT", () => {
    sendStatisticsMessage(protocolModule, totalAttempts, successfulAttempts, failedAttempts, totalSocketLatency, totalHandshakeLatency, maxSocketLatency, maxSocketLatency);
});

function launchTcpingContinuous(target, port, protocolModule, delay = 1500) {
    console.log(chalk.yellow(`🚀 Starting TCPing on ${target}:${port} with ${protocolModule.name} protocol...`));

    const runAttempt = () => {
        totalAttempts++;
        const startTime = Date.now(); // Start of the attempt
        const socket = net.connect({ host: target, port: parseInt(port, 10) });
        let finished = false;
        let connectTime; // Time when 'connect' event occurs

        // finish() is called once per attempt.
        // It prints the connection time (Socket) and, for non-basic protocols,
        // the handshake time (PC) as well.
        const finish = (result) => {
            if (finished) return;
            finished = true;
            const totalDuration = Date.now() - startTime; // Total time of attempt
            const socketLatency = connectTime - startTime; // Time until socket connect
            if (result.success) {
                successfulAttempts++;
                totalSocketLatency += socketLatency;
                // Update min/max socket latency
                if (socketLatency < minSocketLatency) minSocketLatency = socketLatency;
                if (socketLatency > maxSocketLatency) maxSocketLatency = socketLatency;
                let extra = "";
                if (result.extra !== undefined) {
                    extra = ` (PC: ${result.extra}ms)`;
                    totalHandshakeLatency += result.extra;
                }
                console.log(chalk.green(`[${totalAttempts}] Connected to ${target}:${port} in ${socketLatency}ms with ${protocolModule.name} protocol.${extra}`));
            } else {
                failedAttempts++;
                console.log(chalk.red(`[${totalAttempts}] Error connecting to ${target}:${port} after ${totalDuration}ms: ${result.message}`));
            }
            setTimeout(runAttempt, delay);
        };

        socket.on('connect', () => {
            connectTime = Date.now();
            // For the basic protocol, the connection itself is sufficient.
            if (protocolModule.name.toLowerCase() === "basic") {
                finish({ success: true });
            } else {
                // For other protocols, run the handshake and measure its duration.
                protocolModule.runHandshake(socket, target, port, () => {
                    const handshakeDuration = Date.now() - connectTime;
                    finish({ success: true, extra: handshakeDuration });
                });
            }
        });

        socket.on('error', (err) => {
            finish({ success: false, message: err.message });
        });

        socket.setTimeout(5000, () => {
            finish({ success: false, message: "timed out after 5000ms" });
            socket.destroy();
        });
    };

    runAttempt();
}

launchTcpingContinuous(target, port, protocolModule);
