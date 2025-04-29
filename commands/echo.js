"use strict";

import { RegisterCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { WriteLine } from "../terminal.js";

const name = "echo";
const aliases = ["say"];
const overloads = [

    new CommandOverload(`Outputs the provided text into the terminal.`, 
        [
            new CommandParam("text", "The text to echo.", false, true)
        ], 
        [],
        ({__rawText, __tokens}) => {
            WriteLine(__rawText.slice(__tokens[0].length).replace('--text', '').trimStart());
        }
    )

];

RegisterCommand(name, new Command(overloads, aliases));