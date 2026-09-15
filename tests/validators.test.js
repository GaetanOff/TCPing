import test from "node:test";
import assert from "node:assert/strict";
import { validateIp, validatePort } from "../app/utils/validators.js";

test("validateIp - Valid IPv4 addresses", () => {
    assert.strictEqual(validateIp("127.0.0.1"), true);
    assert.strictEqual(validateIp("192.168.1.1"), true);
    assert.strictEqual(validateIp("8.8.8.8"), true);
    assert.strictEqual(validateIp("255.255.255.255"), true);
});

test("validateIp - Valid IPv6 addresses", () => {
    assert.strictEqual(validateIp("::1"), true);
    assert.strictEqual(validateIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), true);
    assert.strictEqual(validateIp("fe80::1"), true);
});

test("validateIp - Hostnames and domains", () => {
    assert.strictEqual(validateIp("localhost"), true);
    assert.strictEqual(validateIp("LOCALHOST"), true);
    assert.strictEqual(validateIp("google.com"), true);
    assert.strictEqual(validateIp("mc.hypixel.net"), true);
    assert.strictEqual(validateIp("my-server.local"), true);
    assert.strictEqual(validateIp("gateway"), true);
});

test("validateIp - Invalid values", () => {
    assert.strictEqual(validateIp(""), false);
    assert.strictEqual(validateIp("   "), false);
    assert.strictEqual(validateIp("http://google.com"), false);
    assert.strictEqual(validateIp("google.com/path"), false);
    assert.strictEqual(validateIp("999.999.999.999"), false);
    assert.strictEqual(validateIp("-bad-host.com"), false);
    assert.strictEqual(validateIp("bad-host-.com"), false);
    assert.strictEqual(validateIp(null), false);
    assert.strictEqual(validateIp(undefined), false);
    assert.strictEqual(validateIp(12345), false);
});

test("validatePort - Valid ports", () => {
    assert.strictEqual(validatePort(1), true);
    assert.strictEqual(validatePort(80), true);
    assert.strictEqual(validatePort(443), true);
    assert.strictEqual(validatePort(25565), true);
    assert.strictEqual(validatePort(65535), true);
    assert.strictEqual(validatePort("1"), true);
    assert.strictEqual(validatePort("80"), true);
    assert.strictEqual(validatePort("65535"), true);
});

test("validatePort - Invalid ports", () => {
    assert.strictEqual(validatePort(0), false);
    assert.strictEqual(validatePort(-1), false);
    assert.strictEqual(validatePort(65536), false);
    assert.strictEqual(validatePort(100000), false);
    assert.strictEqual(validatePort("80abc"), false);
    assert.strictEqual(validatePort("abc80"), false);
    assert.strictEqual(validatePort("80.5"), false);
    assert.strictEqual(validatePort(""), false);
    assert.strictEqual(validatePort(" "), false);
    assert.strictEqual(validatePort(null), false);
    assert.strictEqual(validatePort(undefined), false);
    assert.strictEqual(validatePort(NaN), false);
});
