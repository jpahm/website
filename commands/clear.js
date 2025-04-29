"use strict";

import { RegisterCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { Terminal } from "../terminal.js";

const name = "clear";
const aliases = ["cls", "cl"];
const overloads = [

    new CommandOverload(`Clears the terminal.`, 
        [], 
        [],
        () => {
            const childArray = Array.from(Terminal.children);
            const removableChildren = childArray.filter((c) => c.tagName != "TEXTAREA");
            for (const child of removableChildren)
                child.remove();
    })

];

RegisterCommand(name, new Command(overloads, aliases));