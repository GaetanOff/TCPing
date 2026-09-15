import test from "node:test";
import assert from "node:assert/strict";
import { writeVarInt, readVarInt } from "../app/utils/minecraft.js";

test("writeVarInt & readVarInt - Roundtrip values", () => {
    const testValues = [0, 1, 2, 127, 128, 255, 25565, 2097151, 2147483647];

    for (const val of testValues) {
        const buf = writeVarInt(val);
        assert.ok(Buffer.isBuffer(buf), `Expected buffer for ${val}`);
        const decoded = readVarInt(buf);
        assert.strictEqual(decoded.value, val, `Mismatch for ${val}`);
        assert.strictEqual(decoded.size, buf.length, `Size mismatch for ${val}`);
    }
});

test("readVarInt - Multiple VarInts in single buffer with offset", () => {
    const b1 = writeVarInt(42);
    const b2 = writeVarInt(25565);
    const combined = Buffer.concat([b1, b2]);

    const first = readVarInt(combined, 0);
    assert.strictEqual(first.value, 42);
    assert.strictEqual(first.size, b1.length);

    const second = readVarInt(combined, first.size);
    assert.strictEqual(second.value, 25565);
    assert.strictEqual(second.size, b2.length);
});

test("readVarInt - Incomplete buffer throws RangeError", () => {
    // A VarInt with MSB set indicating more bytes, but buffer ends abruptly
    const incomplete = Buffer.from([0x80]);
    assert.throws(() => {
        readVarInt(incomplete);
    }, RangeError);
});

test("readVarInt - Non-buffer argument throws TypeError", () => {
    assert.throws(() => {
        readVarInt("not a buffer");
    }, TypeError);
});
