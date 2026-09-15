export const name = "FiveM";
export const description = "FiveM handshake & info";

/**
 * Performs a FiveM TCP ping by sending a getinfo query.
 * Completes immediately when response data is received.
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
        // Complete immediately once data arrives
        let meta = "Received info";
        try {
            if (responseData.includes("infoResponse")) {
                meta = "infoResponse received";
            }
        } catch {}
        done({ success: true, meta });
    };

    const onError = (err) => {
        done({ success: false, message: err.message });
    };

    const onClose = () => {
        if (!completed) {
            if (responseData.length > 0) {
                done({ success: true, meta: "Received data" });
            } else {
                done({ success: false, message: "Connection closed before FiveM response" });
            }
        }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);

    timeoutTimer = setTimeout(() => {
        done({ success: false, message: `FiveM handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    // Send getinfo query with null terminator
    const queryBuffer = Buffer.concat([
        Buffer.from("getinfo", "utf8"),
        Buffer.from([0x00])
    ]);
    socket.write(queryBuffer);
}

