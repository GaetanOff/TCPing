export const name = "basic";
export const description = "Basic TCP connection";

/**
 * Performs a trivial handshake for a basic connection.
 *
 * In a basic TCP connection, the handshake is implicitly completed
 * when the TCP connection is established.
 *
 * @param {net.Socket} socket - The established TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {object|Function} [options] - Options or callback function.
 * @param {Function} [callback] - Function to call once handshake completes.
 */
export function runHandshake(socket, target, port, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    if (typeof cb === "function") {
        cb({ success: true });
    }
}

