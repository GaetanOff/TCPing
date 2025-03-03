export const name = "basic";
export const description = "Basic TCP connection";

/**
 * Performs a trivial handshake for a basic connection.
 *
 * In a basic TCP connection, the handshake is implicitly completed
 * when the TCP connection is established. There is no additional data exchange.
 * Therefore, this function simply calls the callback immediately.
 *
 * @param {net.Socket} socket - The established TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - A function to call once the handshake is considered complete.
 */
export function runHandshake(socket, target, port, callback) {
    // For a synack connection, we simply close the connection as soon as it is established.
    callback();
}
