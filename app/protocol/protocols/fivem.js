export const name = "FiveM";
export const description = "FiveM handshake & info";

/**
 * Performs a FiveM TCP ping by sending handshake data.
 *
 * This function sends a "getinfo" query over the TCP connection and accumulates
 * any response data. If any data is received within a timeout period, it calls the
 * callback with a success status and the raw response data.
 *
 * @param {net.Socket} socket - The connected TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - Called with an object: { success: boolean, data?: string }.
 */
export function runHandshake(socket, target, port, callback) {
    // Construct the query packet: "getinfo" followed by a null terminator.
    const queryString = "getinfo";
    const queryBuffer = Buffer.concat([
        Buffer.from(queryString, "utf8"),
        Buffer.from([0x00])
    ]);

    // Send the query over the TCP socket.
    socket.write(queryBuffer);

    // Accumulate response data.
    let responseData = "";
    let received = false;
    let debounceTimer;

    // Handler for incoming data.
    const onData = (data) => {
        received = true;
        responseData += data.toString("utf8");
        // Reset the debounce timer on each data event.
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // No new data for 500ms; consider the handshake complete.
            callback({ success: true, data: responseData });
            socket.removeListener("data", onData);
        }, 500);
    };

    socket.on("data", onData);

    // Overall timeout: if no data is received within 5000ms, return failure.
    setTimeout(() => {
        if (!received) {
            callback({ success: false });
            socket.removeListener("data", onData);
        }
    }, 5000);
}
