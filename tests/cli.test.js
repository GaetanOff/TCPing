import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "child_process";
import net from "net";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPath = path.resolve(__dirname, "../app/main.js");

function runCli(args) {
    return new Promise((resolve) => {
        execFile("node", [mainPath, ...args], (error, stdout, stderr) => {
            resolve({
                code: error ? error.code ?? 1 : 0,
                stdout: stdout.toString(),
                stderr: stderr.toString()
            });
        });
    });
}

test("CLI - --help flag displays help and exits with 0", async () => {
    const res = await runCli(["--help"]);
    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /TCPing - Lightweight TCP connection & latency testing tool/);
    assert.match(res.stdout, /Available Protocols:/);
});

test("CLI - Missing arguments exits with 1 and displays help", async () => {
    const res = await runCli([]);
    assert.strictEqual(res.code, 1);
    assert.match(res.stdout, /Usage:/);
});

test("CLI - Invalid port exits with 1", async () => {
    const res = await runCli(["127.0.0.1", "80abc"]);
    assert.strictEqual(res.code, 1);
    assert.match(res.stdout, /Error: Port "80abc" is invalid/);
});

test("CLI - Invalid IP/domain exits with 1", async () => {
    const res = await runCli(["http://invalid-url", "80"]);
    assert.strictEqual(res.code, 1);
    assert.match(res.stdout, /Error: IP address or domain/);
});

test("CLI - Ping local TCP server with -c 2 stops after 2 attempts", async () => {
    const server = net.createServer((sock) => {
        sock.end();
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    const port = String(server.address().port);

    const res = await runCli(["127.0.0.1", port, "-c", "2", "-i", "50"]);

    server.close();

    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /\[1\] Connected to 127\.0\.0\.1:/);
    assert.match(res.stdout, /\[2\] Connected to 127\.0\.0\.1:/);
    assert.doesNotMatch(res.stdout, /\[3\]/);
    assert.match(res.stdout, /2 packets transmitted, 2 received, 0\.0% packet loss/);
});

test("CLI - Ping HTTP server with HTTP protocol and -c 1 displays HTTP status", async () => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
    });
    await new Promise(r => server.listen(0, "127.0.0.1", r));
    const port = String(server.address().port);

    const res = await runCli(["127.0.0.1", port, "HTTP", "-c", "1"]);

    server.close();

    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /Connected to 127\.0\.0\.1:.*HTTP\/1\.[01] 200 OK/);
    assert.match(res.stdout, /1 packets transmitted, 1 received/);
});
