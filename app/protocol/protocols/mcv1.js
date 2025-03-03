export const name = "MCv1";
export const description = "MC legacy ping (0xFE)";

/**
 * Performs a legacy ping to a Minecraft server.
 *
 * This function sends the legacy ping packet (0xFE) over the TCP connection and waits for
 * a response. The response is a string containing server information.
 *
 * @param {net.Socket} socket - The connected TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - Called with an object: { success: boolean, data?: string }.
 */
export function runHandshake(socket, target, port, callback) {
    // For legacy ping, we simply send the packet 0xFE.
    const pingPacket = Buffer.from([0xFE]);
    socket.write(pingPacket);

    let responseData = "";
    let received = false;
    let debounceTimer;

    // Handler for incoming data.
    const onData = (data) => {
        received = true;
        responseData += data.toString("utf8");
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Once no new data arrives for 500ms, consider the ping complete.
            callback({ success: true, data: responseData });
            socket.removeListener("data", onData);
        }, 500);
    };

    socket.on("data", onData);

    // Overall timeout: if no response is received within 5000ms, return failure.
    setTimeout(() => {
        if (!received) {
            callback({ success: false });
            socket.removeListener("data", onData);
        }
    }, 5000);
}
