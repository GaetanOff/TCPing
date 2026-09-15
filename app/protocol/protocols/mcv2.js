import { readVarInt, writeVarInt } from "../../utils/minecraft.js";

export const name = "MCv2";
export const description = "MC handshake & status (1.7+)";

const protocolVersion = 754; // e.g. 1.16.5
const nextState = 1; // 1 = status, 2 = login

/**
 * Performs a Minecraft handshake and status request to retrieve the server version and player count.
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

        try {
            if (receivedBuffer.length < 2) return;

            let offset = 0;
            // Read overall packet length
            const { value: packetLength, size: lengthSize } = readVarInt(receivedBuffer, offset);
            if (receivedBuffer.length < lengthSize + packetLength) {
                // Wait for more data
                return;
            }

            const packetBuffer = receivedBuffer.slice(lengthSize, lengthSize + packetLength);
            offset = 0;

            // Read packet ID
            const { value: packetId, size: idSize } = readVarInt(packetBuffer, offset);
            offset += idSize;

            if (packetId === 0x00) {
                // Read length of the JSON string
                const { value: jsonLength, size: jsonLenSize } = readVarInt(packetBuffer, offset);
                offset += jsonLenSize;

                if (packetBuffer.length >= offset + jsonLength) {
                    const jsonString = packetBuffer.slice(offset, offset + jsonLength).toString("utf8");
                    const status = JSON.parse(jsonString);

                    const ver = status.version?.name || "MC";
                    const online = status.players?.online ?? "?";
                    const max = status.players?.max ?? "?";
                    done({ success: true, meta: `${ver} (${online}/${max})` });
                    return;
                }
            } else {
                done({ success: true, meta: `Packet ID 0x${packetId.toString(16)}` });
                return;
            }
        } catch {
            // If parsing fails but bytes were received, consider handshake received
            if (receivedBuffer.length > 0) {
                done({ success: true, meta: "Response received" });
            }
        }
    };

    const onError = (err) => {
        done({ success: false, message: err.message });
    };

    const onClose = () => {
        if (!completed) {
            if (receivedBuffer.length > 0) {
                done({ success: true, meta: "Data received before close" });
            } else {
                done({ success: false, message: "Connection closed before MCv2 response" });
            }
        }
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);

    timeoutTimer = setTimeout(() => {
        done({ success: false, message: `MCv2 handshake timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    const serverAddress = target;
    const serverPort = parseInt(port, 10);

    // Encode server address
    const addressBuffer = Buffer.from(serverAddress, "utf8");
    const addressLengthBuffer = writeVarInt(addressBuffer.length);

    // Encode protocolVersion and nextState
    const protocolVersionBuffer = writeVarInt(protocolVersion);
    const nextStateBuffer = writeVarInt(nextState);

    // Construct handshake packet
    const packetId = Buffer.from([0x00]);
    const portBuffer = Buffer.alloc(2);
    portBuffer.writeUInt16BE(serverPort, 0);

    const packetData = Buffer.concat([
        packetId,
        protocolVersionBuffer,
        addressLengthBuffer,
        addressBuffer,
        portBuffer,
        nextStateBuffer
    ]);

    // Prefix packet with length
    const packetLengthBuffer = writeVarInt(packetData.length);
    const fullPacket = Buffer.concat([packetLengthBuffer, packetData]);

    // Send handshake packet
    socket.write(fullPacket);

    // Send status request packet (length 1, ID 0x00)
    const statusRequestPacket = Buffer.concat([
        writeVarInt(1),
        Buffer.from([0x00])
    ]);
    socket.write(statusRequestPacket);
}

