import protocols from "../protocol/protocols.js";
import chalk from "chalk";

export function sendHelpMessage() {
    const protocolsList = Object.values(protocols)
        .map(proto => `  ${chalk.cyan(proto.name + ":")} ${proto.description}`)
        .join("\n");

    console.log(chalk.blue(`
${chalk.yellow.bold("TCP Ping Tool")}
${chalk.cyan("Usage:")} tcping <ip> <port> [protocol] [--resolve|-r]

${chalk.yellow.bold("Available Protocols:")}
${protocolsList}

${chalk.yellow.bold("Description:")}
  This tool continuously attempts to establish a TCP connection to the specified IP or domain.
  It uses the selected protocol to mimic various client behaviors and measure the response time.
  If the --resolve or -r flag is provided, the domain will be resolved to its IP address before pinging.
  If the --timeout or -t flag is provided, it will override the default timeout of 5000ms.

${chalk.yellow.bold("Control:")}
  Press CTRL+C to stop the process.
    `));
}

/**
 * Prints TCPing statistics.
 *
 * @param {number} totalAttempts
 * @param {number} successfulAttempts
 * @param {number} failedAttempts
 * @param {number} totalSocketLatency
 * @param {number} totalHandshakeLatency
 */
export function sendStatisticsMessage(protocolModule, totalAttempts, successfulAttempts, failedAttempts, totalSocketLatency, totalHandshakeLatency, minSocketLatency, maxSocketLatency) {
    console.log(chalk.blue("\n=== TCPing Statistics ==="));
    console.log(`Total Attempts: ${totalAttempts}`);
    console.log(`Successful Attempts: ${successfulAttempts}`);
    console.log(`Failed Attempts: ${failedAttempts}`);
    console.log(`Success Rate: ${((successfulAttempts / totalAttempts) * 100).toFixed(2)}%`);
    if (successfulAttempts > 0) {
        console.log(`Average Socket Latency: ${(totalSocketLatency / successfulAttempts).toFixed(2)}ms`);
        if (protocolModule.name.toLowerCase() !== "basic") {
            console.log(`Average Handshake Latency: ${(totalHandshakeLatency / successfulAttempts).toFixed(2)}ms`);
        }
        console.log(`Min Socket Latency: ${minSocketLatency}ms`);
        console.log(`Max Socket Latency: ${maxSocketLatency}ms`);
    }
    process.exit(0);
}
