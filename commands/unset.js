import { registerCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { variables } from "../terminal.js";

const name = "unset";
const aliases = [];
const overloads = [
    new CommandOverload(
        `Unsets the specified variable.`,
        [
            new CommandParam("variable", "The name of the variable to unset; can only consist of alphanumeric characters and underscores and must not start with a digit.", false, false, (s) => {
                if (!/^[\w_][\w\d_]*$/.test(s))
                    throw new Error("Invalid variable name!");
                return s;
            })
        ],
        [],
        ({ variable }) => {
            delete variables[variable];
        }
    )
];

registerCommand(name, new Command(overloads, aliases));