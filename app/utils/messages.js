import protocols from "../protocol/protocols.js";
import chalk from "chalk";

export function sendHelpMessage() {
    const protocolsList = Object.values(protocols)
        .map(proto => `  ${chalk.cyan(proto.name + ":")} ${proto.description}`)
        .join("\n");

    console.log(chalk.blue(`
${chalk.yellow.bold("TCP Ping Tool")}
${chalk.cyan("Usage:")} tcping <ip> <port> [protocol]

${chalk.yellow.bold("Available Protocols:")}
${protocolsList}

${chalk.yellow.bold("Description:")}
  This tool continuously attempts to establish a TCP connection to the specified IP and port.
  It uses the selected protocol to mimic various client behaviors and measure the response time.

${chalk.yellow.bold("Control:")}
  Press CTRL+C to stop the process.
    `));
}
