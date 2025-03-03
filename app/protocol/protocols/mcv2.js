import { readVarInt, writeVarInt } from "../../utils/minecraft.js";

export const name = "MCv2";
export const description = "MC handshake & status";

const protocolVersion = 754; // Example: 1.16.5
const nextState = 1; // 1 = status, 2 = login

/**
 * Performs a Minecraft handshake and status request to retrieve the server version.
 * Accumulates data until the full packet is received.
 * @param {net.Socket} socket - The connected TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - Called with the server status info once fully received.
 */
export function runHandshake(socket, target, port, callback) {
    const serverAddress = target;
    const serverPort = parseInt(port, 10);

    // Encode server address (with its length as a VarInt)
    const addressBuffer = Buffer.from(serverAddress, 'utf8');
    const addressLengthBuffer = writeVarInt(addressBuffer.length);

    // Encode protocolVersion and nextState as VarInts
    const protocolVersionBuffer = writeVarInt(protocolVersion);
    const nextStateBuffer = writeVarInt(nextState);

    // Construct handshake packet (without length prefix)
    const packetId = Buffer.from([0x00]); // Handshake packet ID
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

    // Prefix packet with its length (as a VarInt)
    const packetLengthBuffer = writeVarInt(packetData.length);
    const fullPacket = Buffer.concat([packetLengthBuffer, packetData]);

    // Send handshake packet
    socket.write(fullPacket);

    // Send the status request packet:
    // It consists of a single packet with ID 0x00 and length 1.
    const statusRequestPacket = Buffer.concat([
        writeVarInt(1), // Packet length = 1
        Buffer.from([0x00]) // Status request packet ID is 0x00
    ]);
    socket.write(statusRequestPacket);

    /**

    // Accumulate incoming data until we have a full packet.
    let receivedBuffer = Buffer.alloc(0);
    const onData = (chunk) => {
        receivedBuffer = Buffer.concat([receivedBuffer, chunk]);
        try {
            let offset = 0;
            // Read overall packet length
            const { value: packetLength, size: lengthSize } = readVarInt(receivedBuffer, offset);
            if (receivedBuffer.length < lengthSize + packetLength) {
                // Not enough data yet
                return;
            }
            // Extract complete packet
            const packetBuffer = receivedBuffer.slice(lengthSize, lengthSize + packetLength);
            // Remove processed bytes from buffer
            receivedBuffer = receivedBuffer.slice(lengthSize + packetLength);

            offset = 0;
            // Read packet ID
            const { value: packetId, size: idSize } = readVarInt(packetBuffer, offset);
            offset += idSize;
            if (packetId !== 0x00) {
                console.error("Unexpected packet ID:", packetId);
                socket.removeListener("data", onData);
                callback(null);
                return;
            }
            // Read the length of the JSON string
            const { value: jsonLength, size: jsonLenSize } = readVarInt(packetBuffer, offset);
            offset += jsonLenSize;
            // Ensure the packetBuffer contains the full JSON data
            if (packetBuffer.length < offset + jsonLength) {
                // Incomplete JSON data, wait for more (this should rarely happen)
                return;
            }
            const jsonString = packetBuffer.slice(offset, offset + jsonLength).toString("utf8");
            const status = JSON.parse(jsonString);
            //console.log("Server version info:", status.version);
            socket.removeListener("data", onData);
            callback(status);
        } catch (err) {
            // We don't know if the error is due to incomplete cutting
            console.error("Error parsing server status chunk:", err.message);
        }
    };

    socket.on("data", onData);
        **/

    socket.once("data", (data) => {
        callback();
    });
}
