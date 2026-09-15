export const name = "HTTP";
export const description = "HTTP/HTTPS minimal GET request";

/**
 * Performs an HTTP banner / status query.
 *
 * Sends a minimal HTTP request and immediately completes as soon as the HTTP
 * status response line is received (e.g. HTTP/1.1 200 OK), without any debounce delay.
 *
 * @param {net.Socket} socket - The connected socket.
 * @param {string} target - The server hostname or IP address.
 * @param {number|string} port - The server port.
 * @param {object|Function} [options] - Options or callback.
 * @param {Function} [callback] - Called with { success: boolean, meta?: string, message?: string }.
 */
export function runHandshake(socket, target, port, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    const timeoutMs = (typeof options === "object" && options?.timeout) || 5000;

    let responseData = "";
    let completed = false;
    let timeoutTimer = null;

    const cleanup = () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        socket.removeListener("data", onData);
        socket.removeListener("error", onError);
        socket.removeListener("close", onClose);
    };

    const done = (result) => {
        if (completed) return;
        completed = true;
        cleanup();
        if (typeof cb === "function") cb(result);
    };

    const onData = (chunk) => {
        responseData += chunk.toString("utf8");
        // As soon as the first line of the HTTP response is received:
        if (responseData.includes("\n")) {
            const firstLine = responseData.split(/\r?\n/)[0].trim();
            done({ success: true, meta: firstLine });
        }
    };

    const onError = (err) => {
        done({ success: false, message: err.message });
    };

    const onClose = () => {
        if (!completed) {
            if (responseData.trim().length > 0) {
                const firstLine = responseData.split(/\r?\n/)[0].trim();
                done({ success: true, meta: firstLine });
            } else {
                done({ success: false, message: "Connection closed before HTTP response" });
            }
        }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);

    timeoutTimer = setTimeout(() => {
        done({ success: false, message: `HTTP handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    const request = `GET / HTTP/1.1\r\nHost: ${target}\r\nUser-Agent: TCPing/1.0\r\nConnection: close\r\n\r\n`;
    socket.write(request);
}

