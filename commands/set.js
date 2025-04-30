import { RegisterCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { Variables } from "../terminal.js";

const name = "set";
const aliases = [];
const overloads = [
    new CommandOverload(
        `Sets a variable with the specified name and value.`,
        [
            new CommandParam("variable", "The name of the variable to set."),
            new CommandParam("value", "The value to assign to the variable. Can be any valid (strict) Javascript value/expression.", false, true)
        ],
        [],
        ({ variable, __rawText, __tokens }) => {
            // Trim out everything except for the actual, raw value
            let rawValue = __rawText
                .replace(__tokens[0], '')
                .replace(/--variable|--value/, '')
                .replace(variable, '')
                .trimStart();
            // We can safely do eval here because the entire site is clientside anyways :)
            Variables[variable] = eval(`"use strict";(${rawValue})`);
        }
    )
];

RegisterCommand(name, new Command(overloads, aliases));