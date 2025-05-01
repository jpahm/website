"use strict";

import { registerCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { writeLine } from "../terminal.js";

const name = "echo";
const aliases = ["say"];
const overloads = [

    new CommandOverload(`Outputs the provided text into the terminal.`, 
        [
            new CommandParam("text", "The text to echo.", false, true)
        ], 
        [],
        ({__rawText, __tokens}) => {
            writeLine(__rawText.slice(__tokens[0].length).replace('--text', '').trimStart());
        }
    )

];

registerCommand(name, new Command(overloads, aliases));