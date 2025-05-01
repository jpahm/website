import { registerCommand, Command, CommandOverload } from "../command.js";
import { writeLine, variables } from "../terminal.js";

const name = "env";
const aliases = [];

const overloads = [
    new CommandOverload(
        "Lists all currently defined variables.",
        [],
        [],
        () => {
            const keys = Object.keys(variables);
            if (keys.length === 0) {
                writeLine("No variables are set.");
                return;
            }

            for (const key of keys) {
                const value = variables[key];
                const formatted = String(typeof value === "object" ? JSON.stringify(value) : value);
                writeLine(`${key} = ${(formatted.length > 50 ? formatted.slice(0, 50) + '...' : formatted)}`);
            }
        }
    )
];

registerCommand(name, new Command(overloads, aliases));