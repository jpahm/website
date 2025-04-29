import { RegisterCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { Variables } from "../terminal.js";

const name = "set";
const aliases = [];
const overloads = [
    new CommandOverload(
        `Sets a variable with the specified name and value.`,
        [
            new CommandParam("variable", "The name of the variable to set."),
            new CommandParam("value", "The value to assign to the variable.", false, true)
        ],
        [],
        ({ variable, __rawText, __tokens }) => {
            // Trim out everything except for the actual, raw value
            let rawValue = __rawText
                .replace(__tokens[0], '')
                .replace(/--variable|--value/, '')
                .replace(variable, '')
                .trimStart();
            Variables[variable] = rawValue;
        }
    )
];

RegisterCommand(name, new Command(overloads, aliases));