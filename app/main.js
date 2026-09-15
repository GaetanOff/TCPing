#!/usr/bin/env node

import net from "net";
import dns from "dns";
import { performance } from "perf_hooks";
import chalk from "chalk";
import { getProtocolModule } from "./protocol/protocols.js";
import { validateIp, validatePort } from "./utils/validators.js";
import { sendHelpMessage, sendStatisticsMessage } from "./utils/messages.js";

const rawArgs = process.argv.slice(2);

// Check for help flag early
if (rawArgs.includes("-h") || rawArgs.includes("--help")) {
    sendHelpMessage();
    process.exit(0);
}

// Parse flags and positional parameters
let timeoutValue = 5000;
let maxCount = Infinity;
let intervalValue = 1000;
let resolveFlag = false;

const params = [];
for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === "-t" || arg === "--timeout") {
        const val = rawArgs[++i];
        if (!val || val.startsWith("-") || !/^\d+$/.test(val) || Number(val) <= 0) {
            console.log(chalk.red(`Error: Missing or invalid value for ${arg} flag (must be a positive integer).`));
            process.exit(1);
        }
        timeoutValue = Number(val);
    } else if (arg === "-c" || arg === "--count") {
        const val = rawArgs[++i];
        if (!val || val.startsWith("-") || !/^\d+$/.test(val) || Number(val) <= 0) {
            console.log(chalk.red(`Error: Missing or invalid value for ${arg} flag (must be a positive integer).`));
            process.exit(1);
        }
        maxCount = Number(val);
    } else if (arg === "-i" || arg === "--interval") {
        const val = rawArgs[++i];
        if (!val || val.startsWith("-") || !/^\d+$/.test(val) || Number(val) < 0) {
            console.log(chalk.red(`Error: Missing or invalid value for ${arg} flag (must be a non-negative integer).`));
            process.exit(1);
        }
        intervalValue = Number(val);
    } else if (arg === "-r" || arg === "--resolve") {
        resolveFlag = true;
    } else if (arg.startsWith("-")) {
        console.log(chalk.red(`Error: Unknown flag "${arg}". Use --help for usage.`));
        process.exit(1);
    } else {
        params.push(arg);
    }
}

if (params.length < 2) {
    sendHelpMessage();
    process.exit(1);
}

const [target, portInput, protocolInput] = params;

if (!validatePort(portInput)) {
    console.log(chalk.red(`Error: Port "${portInput}" is invalid. Please enter a port number between 1 and 65535.`));
    process.exit(1);
}
const port = parseInt(portInput, 10);

if (!validateIp(target)) {
    console.log(chalk.red(`Error: IP address or domain "${target}" is invalid.`));
    process.exit(1);
}

const protocolModule = getProtocolModule(protocolInput, chalk);

// Statistics tracking
let totalAttempts = 0;
let successfulAttempts = 0;
let failedAttempts = 0;
let totalSocketLatency = 0;
let totalHandshakeLatency = 0;
let minSocketLatency = Infinity;
let maxSocketLatency = 0;

let currentSocket = null;
let scheduleTimer = null;
let isStopping = false;

function printStatsAndExit() {
    if (isStopping) return;
    isStopping = true;
    if (scheduleTimer) clearTimeout(scheduleTimer);
    if (currentSocket) {
        try {
            currentSocket.removeAllListeners();
            currentSocket.destroy();
        } catch {}
        currentSocket = null;
    }
    sendStatisticsMessage(
        protocolModule,
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        totalSocketLatency,
        totalHandshakeLatency,
        minSocketLatency,
        maxSocketLatency
    );
}

// Handle termination signals
process.on("SIGINT", printStatsAndExit);
process.on("SIGTERM", printStatsAndExit);

/**
 * Continuously pings the target TCP port using the selected protocol.
 *
 * @param {string} displayTarget - The user-provided target string.
 * @param {string} connectHost - The actual host/IP to connect to.
 * @param {number} port - The target port number.
 * @param {object} protocol - The protocol module.
 */
function launchTcping(displayTarget, connectHost, port, protocol) {
    const isBasic = protocol.name.toLowerCase() === "basic";
    const hostInfo = displayTarget !== connectHost ? `${displayTarget} [${connectHost}]:${port}` : `${displayTarget}:${port}`;

    if (isBasic) {
        console.log(chalk.yellow(`🚀 Starting TCPing on ${hostInfo}...`));
    } else {
        console.log(chalk.yellow(`🚀 Starting TCPing on ${hostInfo} with ${protocol.name} protocol...`));
    }

    const runAttempt = () => {
        if (isStopping) return;
        totalAttempts++;

        const startTime = performance.now();
        let finished = false;
        let connectTime = null;

        const socket = net.connect({ host: connectHost, port });
        currentSocket = socket;

        const finish = (result) => {
            if (finished || isStopping) return;
            finished = true;

            // Cleanup socket immediately to prevent resource leakage
            try {
                socket.removeAllListeners();
                socket.destroy();
            } catch {}
            if (currentSocket === socket) currentSocket = null;

            const totalDuration = performance.now() - startTime;

            if (result.success) {
                successfulAttempts++;
                const socketLatency = (connectTime !== null ? connectTime : performance.now()) - startTime;
                totalSocketLatency += socketLatency;
                if (socketLatency < minSocketLatency) minSocketLatency = socketLatency;
                if (socketLatency > maxSocketLatency) maxSocketLatency = socketLatency;

                let extra = "";
                if (result.handshakeLatency !== undefined) {
                    totalHandshakeLatency += result.handshakeLatency;
                    const metaStr = result.meta ? `, ${result.meta}` : "";
                    extra = ` (Handshake: ${result.handshakeLatency.toFixed(1)}ms${metaStr})`;
                } else if (result.meta) {
                    extra = ` (${result.meta})`;
                }

                const latencyStr = `${socketLatency.toFixed(1)}ms`;
                if (isBasic) {
                    console.log(chalk.green(`[${totalAttempts}] Connected to ${hostInfo} in ${latencyStr}.${extra}`));
                } else {
                    console.log(chalk.green(`[${totalAttempts}] Connected to ${hostInfo} in ${latencyStr} with ${protocol.name} protocol.${extra}`));
                }
            } else {
                failedAttempts++;
                const durationStr = `${totalDuration.toFixed(1)}ms`;
                console.log(chalk.red(`[${totalAttempts}] Error connecting to ${hostInfo} after ${durationStr}: ${result.message}`));
            }

            if (totalAttempts >= maxCount) {
                printStatsAndExit();
            } else {
                scheduleTimer = setTimeout(runAttempt, intervalValue);
            }
        };

        socket.on("connect", () => {
            connectTime = performance.now();

            if (isBasic) {
                finish({ success: true });
            } else {
                protocol.runHandshake(socket, displayTarget, port, { timeout: timeoutValue }, (handshakeResult) => {
                    if (handshakeResult?.success) {
                        const handshakeDuration = performance.now() - connectTime;
                        finish({
                            success: true,
                            handshakeLatency: handshakeDuration,
                            meta: handshakeResult.meta
                        });
                    } else {
                        finish({
                            success: false,
                            message: handshakeResult?.message || "Handshake failed"
                        });
                    }
                });
            }
        });

        socket.on("error", (err) => {
            finish({ success: false, message: err.message });
        });

        socket.setTimeout(timeoutValue, () => {
            finish({ success: false, message: `timed out after ${timeoutValue}ms` });
        });
    };

    runAttempt();
}

/**
 * Initializes TCPing, resolving DNS if requested.
 */
async function init() {
    let connectHost = target;

    if (resolveFlag && net.isIP(target) === 0) {
        try {
            const { address } = await dns.promises.lookup(target);
            console.log(chalk.gray(`Resolved domain "${target}" to IP: ${address}`));
            connectHost = address;
        } catch (err) {
            console.log(chalk.red(`Error resolving domain "${target}": ${err.message}`));
            process.exit(1);
        }
    }

    launchTcping(target, connectHost, port, protocolModule);
}

init();

