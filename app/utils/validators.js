import net from "net";

/**
 * Checks that the IP is valid.
 * Use net.isIP(), which returns 0 for an invalid IP, 4 for an IPv4 and 6 for an IPv6.
 * @param {string} ip - IP address to be validated.
 * @returns {boolean} - true if the IP is valid, false otherwise.
 */
export function validateIp(ip) {
    return net.isIP(ip) !== 0;
}

/**
 * Checks that the port is a valid integer in the range 1 to 65535.
 * @param {string|number} port - The port to validate.
 * @returns {boolean} - true if the port is valid, false otherwise.
 */
export function validatePort(port) {
    const portNumber = parseInt(port, 10);
    return Number.isInteger(portNumber) && portNumber >= 1 && portNumber <= 65535;
}
