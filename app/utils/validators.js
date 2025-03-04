import net from "net";

/**
 * Checks whether the input is either a valid IP address or a valid domain name.
 * For IP addresses, it uses net.isIP() (returns 0 for invalid, 4 for IPv4, and 6 for IPv6).
 * For domain names, a simple regex is used to validate the format.
 *
 * @param {string} ip - The IP address or domain name to validate.
 * @returns {boolean} - True if the input is a valid IP address or domain name, false otherwise.
 */
export function validateIp(ip) {
    // Check if it's a valid IP address (IPv4 or IPv6)
    if (net.isIP(ip) !== 0) return true;

    // If not an IP, check if it's a valid domain name.
    // This regex matches typical domain names like "example.com" or "sub.domain.co.uk".
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(ip);
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
