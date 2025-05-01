import { registerCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { variables, contextualEval } from "../terminal.js";

const name = "set";
const aliases = [];
const overloads = [
    new CommandOverload(
        `Sets a variable with the specified name and value.`,
        [
            new CommandParam("variable", "The name of the variable to set; can only consist of alphanumeric characters and underscores and must not start with a digit.", false, false, (s) => {
                if (!/[\w_][\w\d_]*/.test(s))
                    throw new Error("Invalid variable name!");
                return s;
            }),
            new CommandParam("value", "The value to assign to the variable. Can be any valid (strict mode) Javascript expression.", false, true)
        ],
        [],
        ({ variable, __rawText, __tokens }) => {
            // Trim out everything except for the actual, raw value
            let rawValue = __rawText
                .replace(__tokens[0], '')
                .replace(/--variable|--value/g, '')
                .replace(variable, '')
                .trim();
            variables[variable] = contextualEval(rawValue, variables);
        }
    )
];

registerCommand(name, new Command(overloads, aliases));