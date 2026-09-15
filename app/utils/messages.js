import protocols from "../protocol/protocols.js";
import chalk from "chalk";

export function sendHelpMessage() {
    const uniqueProtos = [...new Set(Object.values(protocols))];
    const protocolsList = uniqueProtos
        .map(proto => `    ${chalk.cyan(proto.name.padEnd(8))} ${proto.description}`)
        .join("\n");

    console.log(`
${chalk.yellow.bold("TCPing")} - Lightweight TCP connection & latency testing tool

${chalk.yellow.bold("Usage:")}
  tcping <target> <port> [protocol] [options]
  node app/main.js <target> <port> [protocol] [options]

${chalk.yellow.bold("Parameters:")}
  ${chalk.cyan("target")}         Target IP address or domain name (e.g. 127.0.0.1, example.com, localhost)
  ${chalk.cyan("port")}           Target TCP port (1-65535)
  ${chalk.cyan("protocol")}       Protocol to simulate (default: basic)

${chalk.yellow.bold("Available Protocols:")}
${protocolsList}

${chalk.yellow.bold("Options:")}
  ${chalk.cyan("-r, --resolve")}        Resolve target domain to IP once upfront before testing
  ${chalk.cyan("-t, --timeout <ms>")}   Timeout per attempt in milliseconds (default: 5000)
  ${chalk.cyan("-c, --count <n>")}      Number of ping attempts to send before exiting
  ${chalk.cyan("-i, --interval <ms>")}  Delay between ping attempts in milliseconds (default: 1000)
  ${chalk.cyan("-h, --help")}           Display this help message and exit

${chalk.yellow.bold("Examples:")}
  tcping example.com 80
  tcping example.com 443 HTTP -c 4 -i 500
  tcping 127.0.0.1 22 SSH -t 2000
  tcping mc.hypixel.net 25565 MCv2 -r -c 5

${chalk.gray("Press CTRL+C at any time to stop and view statistics.")}
`);
}

/**
 * Prints TCPing statistics.
 *
 * @param {object} protocolModule - Active protocol module.
 * @param {number} totalAttempts
 * @param {number} successfulAttempts
 * @param {number} failedAttempts
 * @param {number} totalSocketLatency
 * @param {number} totalHandshakeLatency
 * @param {number} minSocketLatency
 * @param {number} maxSocketLatency
 */
export function sendStatisticsMessage(protocolModule, totalAttempts, successfulAttempts, failedAttempts, totalSocketLatency, totalHandshakeLatency, minSocketLatency, maxSocketLatency) {
    console.log(chalk.blue("\n--- TCPing Statistics ---"));
    if (totalAttempts === 0) {
        console.log("No attempts were performed.");
        process.exit(0);
    }

    const isBasic = protocolModule?.name?.toLowerCase() === "basic";
    const lossPercentage = ((failedAttempts / totalAttempts) * 100).toFixed(1);
    const successPercentage = ((successfulAttempts / totalAttempts) * 100).toFixed(1);

    console.log(`${totalAttempts} packets transmitted, ${successfulAttempts} received, ${lossPercentage}% packet loss (${successPercentage}% success)`);

    if (successfulAttempts > 0) {
        const avgSocket = (totalSocketLatency / successfulAttempts).toFixed(2);
        const minSocket = minSocketLatency.toFixed(2);
        const maxSocket = maxSocketLatency.toFixed(2);
        console.log(`Socket Latency   : min = ${minSocket}ms, avg = ${avgSocket}ms, max = ${maxSocket}ms`);

        if (!isBasic) {
            const avgHandshake = (totalHandshakeLatency / successfulAttempts).toFixed(2);
            console.log(`Handshake Latency: avg = ${avgHandshake}ms`);
        }
    }
    process.exit(0);
}

