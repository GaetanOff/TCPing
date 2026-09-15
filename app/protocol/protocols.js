import chalk from "chalk";
import * as synack from "./protocols/basic.js";
import * as fivem from "./protocols/fivem.js";
import * as mcv1 from "./protocols/mcv1.js";
import * as mcv2 from "./protocols/mcv2.js";
import * as ssh from "./protocols/ssh.js";
import * as http from "./protocols/http.js";

const protocols = {
    [synack.name.toLowerCase()]: synack,
    synack: synack,
    [fivem.name.toLowerCase()]: fivem,
    [mcv1.name.toLowerCase()]: mcv1,
    [mcv2.name.toLowerCase()]: mcv2,
    [ssh.name.toLowerCase()]: ssh,
    [http.name.toLowerCase()]: http,
};

/**
 * Finds a protocol module by name.
 *
 * @param {string} [protocolInput] - Protocol name.
 * @returns {object|null} The protocol module or null if not found.
 */
export function findProtocol(protocolInput) {
    if (!protocolInput || protocolInput.startsWith("-")) {
        return protocols["basic"];
    }
    return protocols[protocolInput.toLowerCase()] || null;
}

/**
 * Returns the protocol module corresponding to the input.
 * If no protocol is provided or a flag is passed, returns the "basic" protocol.
 * If the protocol is unknown, displays an error and exits.
 *
 * @param {string} [protocolInput] - Protocol input.
 * @param {object} [customChalk] - Optional chalk instance.
 * @returns {object} The protocol module.
 */
export function getProtocolModule(protocolInput, customChalk = chalk) {
    const proto = findProtocol(protocolInput);
    if (!proto) {
        console.log(customChalk.red(`Unknown protocol: "${protocolInput}"\n`));
        console.log(customChalk.yellow("Available protocols:"));
        // Deduplicate protocol modules
        const uniqueProtos = [...new Set(Object.values(protocols))];
        uniqueProtos.forEach(p => {
            console.log(`- ${p.name} : ${p.description}`);
        });
        process.exit(1);
    }
    return proto;
}

export default protocols;

