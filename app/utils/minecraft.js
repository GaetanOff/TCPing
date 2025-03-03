/**
 * Encodes a number as a VarInt.
 *
 * A VarInt (variable-length integer) is encoded 7 bits at a time, with the most significant bit (MSB)
 * used to indicate whether there are more bytes to follow (MSB=1) or not (MSB=0).
 *
 * @param {number} value - The integer to encode.
 * @returns {Buffer} - A Buffer containing the encoded VarInt.
 */
export function writeVarInt(value) {
    const bufferArray = [];
    // Encode the integer in groups of 7 bits.
    do {
        // Mask the lower 7 bits of the value.
        let temp = value & 0b01111111;
        // Right-shift the value by 7 bits (unsigned shift).
        value >>>= 7;
        // If there are still more bits to encode, set the MSB to 1.
        if (value !== 0) {
            temp |= 0b10000000;
        }
        // Push the encoded byte into the array.
        bufferArray.push(temp);
    } while (value !== 0);
    // Convert the array of bytes into a Buffer and return it.
    return Buffer.from(bufferArray);
}

/**
 * Decodes a VarInt from a Buffer starting at a given offset.
 *
 * Reads bytes one by one, extracting 7 bits per byte and shifting them into place.
 * The most significant bit (MSB) of each byte indicates whether more bytes follow.
 *
 * @param {Buffer} buffer - The buffer from which to read the VarInt.
 * @param {number} [offset=0] - The offset in the buffer to start reading.
 * @returns {Object} - An object containing the decoded value and the number of bytes read.
 *                     Format: { value: number, size: number }
 * @throws {Error} - Throws an error if more than 5 bytes are read (indicating a too-big VarInt).
 */
export function readVarInt(buffer, offset = 0) {
    let numRead = 0;
    let result = 0;
    let read;
    // Read one byte at a time until a byte is found with its MSB not set.
    do {
        // Read the byte at the current position.
        read = buffer[offset + numRead];
        // Extract the lower 7 bits and shift them to the correct position.
        result |= (read & 0b01111111) << (7 * numRead);
        numRead++;
        // If more than 5 bytes are read, the VarInt is too big (Minecraft protocol spec).
        if (numRead > 5) {
            throw new Error("VarInt is too big");
        }
    } while ((read & 0b10000000) !== 0);
    // Return the decoded value and the number of bytes that were read.
    return { value: result, size: numRead };
}
