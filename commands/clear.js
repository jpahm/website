"use strict";

import { registerCommand, Command, CommandOverload } from "../command.js";
import { clearScreen } from "../terminal.js";

const name = "clear";
const aliases = ["cls", "cl"];
const overloads = [

    new CommandOverload(`Clears the terminal.`, 
        [], 
        [],
        () => {
            clearScreen();
    })

];

registerCommand(name, new Command(overloads, aliases));