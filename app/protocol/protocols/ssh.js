import net from "net";

export const name = "SSH";
export const description = "SSH handshake";

/**
 * Performs an SSH handshake by reading the server's banner.
 *
 * When connecting to an SSH server, the server sends its version banner automatically.
 * This function waits for that banner and calls the callback with an object containing
 * a success flag and the banner (if received).
 *
 * @param {net.Socket} socket - The connected TCP socket.
 * @param {string} target - The server IP address.
 * @param {number|string} port - The server port.
 * @param {Function} callback - Called with an object: { success: boolean, banner?: string }.
 */
export function runHandshake(socket, target, port, callback) {
    let responseData = "";
    let dataTimeout = null;

    // Handler for incoming data
    const onData = (data) => {
        responseData += data.toString("utf8");
        // SSH banners typically end with "\r\n"
        if (responseData.includes("\r\n")) {
            clearTimeout(dataTimeout);
            callback({ success: true, banner: responseData.trim() });
            socket.removeListener("data", onData);
        }
    };

    socket.on("data", onData);

    // Overall timeout: if no data is received within 5000ms, return failure.
    dataTimeout = setTimeout(() => {
        if (!responseData) {
            callback({ success: false });
            socket.removeListener("data", onData);
        }
    }, 5000);
}
