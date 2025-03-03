import net from "net";

export const name = "HTTP";
export const description = "HTTP/HTTPS minimal GET request";

/**
 * Performs an HTTP/HTTPS banner query.
 *
 * This function sends a minimal GET request over the provided socket
 * and accumulates any response data (typically the HTTP response headers).
 * If data is received within a timeout period, it calls the callback with
 * a success status and the raw response data.
 *
 * The caller is responsible for providing either a plain TCP socket (for HTTP)
 * or a TLS socket (for HTTPS).
 *
 * @param {net.Socket} socket - The connected socket (TCP or TLS).
 * @param {string} target - The server hostname or IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - Called with an object: { success: boolean, data?: string }.
 */
export function runHandshake(socket, target, port, callback) {
    // Build a minimal HTTP GET request.
    // The Host header is set to the provided target.
    const request = `GET / HTTP/1.1\r\nHost: ${target}\r\nConnection: close\r\n\r\n`;
    socket.write(request);

    let responseData = "";
    let received = false;
    let debounceTimer;

    // Handler for incoming data.
    const onData = (data) => {
        received = true;
        responseData += data.toString("utf8");
        // Clear and reset the debounce timer on every data event.
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // No new data for 500ms: consider the response complete.
            callback({ success: true, data: responseData });
            socket.removeListener("data", onData);
        }, 500);
    };

    socket.on("data", onData);

    // Overall timeout: if no data is received within 5000ms, consider it a failure.
    setTimeout(() => {
        if (!received) {
            callback({ success: false });
            socket.removeListener("data", onData);
        }
    }, 5000);
}
