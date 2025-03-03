import * as synack from "./protocols/basic.js";
import * as fivem from "./protocols/fivem.js";
import * as mcv1 from "./protocols/mcv1.js";
import * as mcv2 from "./protocols/mcv2.js";
import * as ssh from "./protocols/ssh.js";
import * as http from "./protocols/http.js";

const protocols = {
    [synack.name.toLowerCase()]: synack,
    [fivem.name.toLowerCase()]: fivem,
    [mcv1.name.toLowerCase()]: mcv1,
    [mcv2.name.toLowerCase()]: mcv2,
    [ssh.name.toLowerCase()]: ssh,
    [http.name.toLowerCase()]: http,
};

/**
 * Returns the protocol module corresponding to the input.
 * Si aucun protocole n'est fourni, retourne le protocole "synack".
 * If the protocol does not exist, displays an error message and terminates the process.
 * @param {string} protocolInput - Protocol input (optional).
 * @param {object} chalk - The chalk module for colored displays.
 * @returns {object} The protocol module.
 */
export function getProtocolModule(protocolInput, chalk) {
    let protocolModule;
    if (!protocolInput) {
        protocolModule = protocols["basic"];
    } else {
        const inputNormalized = protocolInput.toLowerCase();
        protocolModule = protocols[inputNormalized];
        if (!protocolModule) {
            console.log(chalk.red(`Unknown protocol: "${protocolInput}"\n`));
            console.log(chalk.yellow("Available protocols:"));
            Object.values(protocols).forEach(proto => {
                console.log(`- ${proto.name} : ${proto.description}`);
            });
            process.exit(1);
        }
    }
    return protocolModule;
}

export default protocols;
