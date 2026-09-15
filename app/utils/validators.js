import net from "net";

/**
 * Checks whether the input is either a valid IP address (IPv4/IPv6) or a valid domain name/hostname.
 * Supports IPv4, IPv6, localhost, single-label local hostnames, and FQDNs according to RFC 1123.
 *
 * @param {string} ip - The IP address or domain name to validate.
 * @returns {boolean} - True if the input is a valid IP address or domain/hostname, false otherwise.
 */
export function validateIp(ip) {
    if (typeof ip !== "string") return false;
    const trimmed = ip.trim();
    if (!trimmed || trimmed.length > 253) return false;

    // Check if it's a valid IP address (IPv4 or IPv6)
    if (net.isIP(trimmed) !== 0) return true;

    // If it looks like an IPv4 address (all numeric octets) but net.isIP was 0, it's an invalid IP
    if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) return false;

    // Support 'localhost'
    if (trimmed.toLowerCase() === "localhost") return true;

    // RFC 1123 compliant hostname / domain regex
    const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    if (!hostnameRegex.test(trimmed)) return false;

    // In DNS / RFC 3696, the TLD cannot be purely numeric
    if (trimmed.includes(".")) {
        const tld = trimmed.split(".").pop();
        if (/^\d+$/.test(tld)) return false;
    }

    return true;
}

/**
 * Checks that the port is strictly a valid integer in the range 1 to 65535.
 * Rejects non-integers, floats, negative numbers, and strings with trailing characters (e.g. "80abc").
 *
 * @param {string|number} port - The port to validate.
 * @returns {boolean} - true if the port is valid, false otherwise.
 */
export function validatePort(port) {
    if (port === null || port === undefined) return false;
    const str = String(port).trim();
    if (!/^\d+$/.test(str)) return false;

    const portNumber = Number(str);
    return Number.isSafeInteger(portNumber) && portNumber >= 1 && portNumber <= 65535;
}

