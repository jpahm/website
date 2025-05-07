"use strict";

import { registerCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { loadPath } from "../terminal.js";

const name = "cd";
const aliases = [];
const overloads = [

    new CommandOverload(`Changes the current working directory.`, 
        [
            new CommandParam("path", "The path to change to.", false)
        ], 
        [],
        ({path}) => {
            loadPath(path.trim());
        }
    )

];

registerCommand(name, new Command(overloads, aliases));