import net from "net";
import chalk from "chalk";
import {getProtocolModule} from "./protocol/protocols.js";
import {validateIp, validatePort} from "./utils/validators.js";
import {sendHelpMessage} from "./utils/messages.js";

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

function launchTcpingContinuous(target, port, protocolModule, delay = 1500) {
    console.log(chalk.yellow(`🚀 Starting TCPing on ${target}:${port} with ${protocolModule.name} protocol...`));
    let attempt = 1;

    const runAttempt = () => {
        const startTime = Date.now(); // start of the attempt
        const socket = net.connect({ host: target, port: parseInt(port, 10) });
        let finished = false;
        let connectTime; // will store the time when 'connect' event occurs

        // finish() is called once per attempt.
        // It prints the connection time (from start to connect) and, for non-basic protocols,
        // the handshake time (from connect to handshake completion).
        const finish = (result) => {
            if (finished) return;
            finished = true;
            const totalDuration = Date.now() - startTime; // total time of attempt
            const socketDuration = connectTime - startTime; // time until socket connect
            if (result.success) {
                let extra = (result.extra !== undefined) ? ` (PC: ${result.extra}ms)` : "";
                console.log(chalk.green(`[${attempt}] Connected to ${target}:${port} in ${socketDuration}ms with ${protocolModule.name} protocol.${extra}`));
            } else {
                console.log(chalk.red(`[${attempt}] Error connecting to ${target}:${port} after ${totalDuration}ms: ${result.message}`));
            }
            attempt++;
            setTimeout(runAttempt, delay);
        };

        socket.on('connect', () => {
            connectTime = Date.now();
            // For the basic protocol, the connection itself is enough.
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
