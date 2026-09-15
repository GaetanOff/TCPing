export const name = "SSH";
export const description = "SSH handshake";

/**
 * Performs an SSH handshake by reading the server's version banner.
 *
 * @param {net.Socket} socket - The connected TCP socket.
 * @param {string} target - The server IP address.
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
        if (responseData.includes("\n")) {
            // Find SSH banner line (starts with SSH-)
            const lines = responseData.split(/\r?\n/);
            const bannerLine = lines.find(line => line.startsWith("SSH-")) || lines[0].trim();
            done({ success: true, meta: bannerLine });
        }
    };

    const onError = (err) => {
        done({ success: false, message: err.message });
    };

    const onClose = () => {
        if (!completed) {
            done({ success: false, message: "Connection closed by remote host before SSH banner" });
        }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);

    timeoutTimer = setTimeout(() => {
        done({ success: false, message: `SSH handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);
}

