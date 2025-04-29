"use strict";

import { RegisterCommand, Command, CommandOverload, CommandParam } from "../command.js";
import { Terminal } from "../terminal.js"

const name = "color";
const aliases = [];
const overloads = [

    new CommandOverload(`Sets the background and the text color of the terminal.`, 
        [
            new CommandParam("background", "The background color. Can be a word, rgb value, or hex code.", true),
            new CommandParam("text", "The text color. Can be a word, rgb value, or hex code.", true)
        ], 
        [],
        ({background, text}) => {
            document.getElementsByTagName('html')[0].style.backgroundColor = background;
            if (text != undefined)
                Terminal.style.color = text;
        }
    )

];

RegisterCommand(name, new Command(overloads, aliases));