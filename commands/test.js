import { registerCommand, Command, CommandOverload, CommandParam, CommandFlag } from "../command.js";
import { writeLine } from "../terminal.js";

const name = "test";
const aliases = [];
const overloads = [
    new CommandOverload(
        `Test command.`,
        [
            new CommandParam("ov", "optional variadic", true, true),
            new CommandParam("p", "required positional"),
            new CommandParam("v", "required variadic", false, true),
            new CommandParam("op", "optional positional", true)
        ],
        [
            new CommandFlag("v", "test flag 1"),
            new CommandFlag("x", "test flag 2")
        ],
        ({ ov, p, v, op, __rawText, __tokens }, flags) => {
            writeLine(`
                raw: ${__rawText}
                tokens: ${__tokens}
                ov: ${ov.join(',')}
                p: ${p}
                v: ${v.join(',')}
                op: ${op}
                flags: ${JSON.stringify(flags)}
                `);
        }
    )
];

registerCommand(name, new Command(overloads, aliases, true));