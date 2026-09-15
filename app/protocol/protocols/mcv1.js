export const name = "MCv1";
export const description = "MC legacy ping (0xFE)";

/**
 * Performs a legacy ping to a Minecraft server (packet 0xFE).
 * Completes immediately when response packet (0xFF) arrives.
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

    let receivedBuffer = Buffer.alloc(0);
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
        receivedBuffer = Buffer.concat([receivedBuffer, chunk]);

        // Legacy response packet starts with 0xFF followed by 2 bytes UTF-16BE character length
        if (receivedBuffer.length >= 3 && receivedBuffer[0] === 0xFF) {
            const charCount = receivedBuffer.readUInt16BE(1);
            const expectedByteLength = 3 + charCount * 2;
            if (receivedBuffer.length >= expectedByteLength) {
                const str = receivedBuffer.slice(3, expectedByteLength).toString("utf16be");
                let meta = "Legacy Ping response";
                if (str.startsWith("§1\u0000")) {
                    const parts = str.split("\u0000");
                    const version = parts[2];
                    const motd = parts[3];
                    const online = parts[4];
                    const max = parts[5];
                    meta = `${version} (${online}/${max}) - ${motd}`;
                } else {
                    const parts = str.split("§");
                    if (parts.length >= 3) {
                        meta = `${parts[0]} (${parts[1]}/${parts[2]})`;
                    }
                }
                done({ success: true, meta });
                return;
            }
        } else if (receivedBuffer.length > 0 && receivedBuffer[0] !== 0xFF) {
            // Not a legacy MC server or unexpected byte
            done({ success: true, meta: "Data received" });
        }
    };

    const onError = (err) => {
        done({ success: false, message: err.message });
    };

    const onClose = () => {
        if (!completed) {
            if (receivedBuffer.length > 0) {
                done({ success: true, meta: "Response received before close" });
            } else {
                done({ success: false, message: "Connection closed before MC legacy response" });
            }
        }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);

    timeoutTimer = setTimeout(() => {
        done({ success: false, message: `MCv1 handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    // Send legacy ping packet 0xFE
    socket.write(Buffer.from([0xFE]));
}

