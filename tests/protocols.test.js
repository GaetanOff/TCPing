import test from "node:test";
import assert from "node:assert/strict";
import net from "net";
import http from "http";
import protocols, { findProtocol } from "../app/protocol/protocols.js";
import * as basicProto from "../app/protocol/protocols/basic.js";
import * as httpProto from "../app/protocol/protocols/http.js";
import * as sshProto from "../app/protocol/protocols/ssh.js";

test("findProtocol - Returns expected modules", () => {
    assert.strictEqual(findProtocol("basic"), basicProto);
    assert.strictEqual(findProtocol("BASIC"), basicProto);
    assert.strictEqual(findProtocol("synack"), basicProto);
    assert.strictEqual(findProtocol("http"), httpProto);
    assert.strictEqual(findProtocol("HTTP"), httpProto);
    assert.strictEqual(findProtocol("ssh"), sshProto);
    assert.strictEqual(findProtocol(undefined), basicProto);
    assert.strictEqual(findProtocol("-r"), basicProto);
    assert.strictEqual(findProtocol("nonexistent"), null);
});

test("Protocols dictionary contains required protocols", () => {
    const required = ["basic", "http", "ssh", "mcv1", "mcv2", "fivem"];
    for (const name of required) {
        assert.ok(protocols[name], `Protocol ${name} is missing from protocols`);
        assert.strictEqual(typeof protocols[name].runHandshake, "function");
        assert.ok(protocols[name].description);
    }
});

test("basic protocol handshake - Completes immediately", async () => {
    const server = net.createServer((sock) => {
        sock.end();
    });

    await new Promise(res => server.listen(0, "127.0.0.1", res));
    const port = server.address().port;

    const socket = net.connect({ host: "127.0.0.1", port });
    await new Promise(res => socket.on("connect", res));

    const result = await new Promise((res) => {
        basicProto.runHandshake(socket, "127.0.0.1", port, (r) => res(r));
    });

    socket.destroy();
    server.close();

    assert.ok(result.success);
});

test("HTTP protocol handshake - Detects HTTP response status line without 500ms debounce", async () => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
    });

    await new Promise(res => server.listen(0, "127.0.0.1", res));
    const port = server.address().port;

    const socket = net.connect({ host: "127.0.0.1", port });
    await new Promise(res => socket.on("connect", res));

    const start = Date.now();
    const result = await new Promise((res) => {
        httpProto.runHandshake(socket, "127.0.0.1", port, { timeout: 2000 }, (r) => res(r));
    });
    const elapsed = Date.now() - start;

    socket.destroy();
    server.close();

    assert.ok(result.success);
    assert.match(result.meta, /HTTP\/1\.[01] 200 OK/);
    // Verified that it did NOT wait for 500ms debounce!
    assert.ok(elapsed < 400, `Elapsed time was ${elapsed}ms, expected < 400ms (no 500ms debounce)`);
});

test("SSH protocol handshake - Extracts SSH banner", async () => {
    const server = net.createServer((sock) => {
        sock.write("SSH-2.0-OpenSSH_9.2p1 Debian\r\n");
    });

    await new Promise(res => server.listen(0, "127.0.0.1", res));
    const port = server.address().port;

    const socket = net.connect({ host: "127.0.0.1", port });
    await new Promise(res => socket.on("connect", res));

    const result = await new Promise((res) => {
        sshProto.runHandshake(socket, "127.0.0.1", port, { timeout: 2000 }, (r) => res(r));
    });

    socket.destroy();
    server.close();

    assert.ok(result.success);
    assert.strictEqual(result.meta, "SSH-2.0-OpenSSH_9.2p1 Debian");
});
