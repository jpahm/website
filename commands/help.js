"use strict";

import { RegisterCommand, Command, Commands, CommandOverload, CommandParam } from "../command.js";
import { WriteLine } from "../terminal.js";

const name = "help";
const aliases = [];
const overloads = [

    new CommandOverload(
        `Displays this help menu.`,
        [],
        [],
        () => {
            // List basic help info for all commands alphabetically
            for (let commandName of Object.keys(Commands).sort())
                WriteHelpInfo(commandName, false);
        }
    ),

    new CommandOverload(
        `Displays detailed help information for the specified command.`,
        [
            new CommandParam("command", `The name of the command to get detailed help for.`)
        ],
        [],
        ({command}) => {
            let cmd = Commands[command];
            if (cmd == undefined) {
                throw new Error(`Command \"${command}\" does not exist.`);
            }
            WriteHelpInfo(command, true);
        }
    )

];

/**
 * Writes help info for the specified command to the terminal.
 * @param {string} cmdName The name of the command to get help info for. 
 * @param {boolean} detailed Whether to show detailed help info. Defaults to false.
 */
function WriteHelpInfo(cmdName, detailed = false) {
    const cmd = Commands[cmdName];
    let outputText = "";
    // List the aliases in detailed view
    if (detailed) {
        outputText += `<u><b>HELP FOR: ${cmdName}</b></u>`;
        if (cmd.Aliases.length > 0)
            outputText += `\n<b>Aliases:</b> ${cmd.Aliases.join(', ')}\n\n`;
        else
            outputText += "\n\n";
    }
    // Only show first 2 overloads if not in detailed view
    const includedOverloads = detailed ? cmd.Overloads : cmd.Overloads.slice(0, 3);

    // Write help text for each of a command's overloads
    const overloadTexts = [];
    for (const overload of includedOverloads) {
        let syntaxText = `${cmdName}`;
        let paramDescs = "";
        let flagDescs = "";
        // Build the syntax text and param descriptions from the overload's params
        for (const param of overload.Params) {
            const v = param.Variadic ? '...' : '';
            syntaxText += param.Optional ? ` [${param.Name}${v}]` : ` &lt;${param.Name}${v}&gt;`;
            paramDescs += `--${param.Name}: ${param.Description} ${param.Optional ? '<b>(OPTIONAL)</b>' : ''}\n`;
        }

        // Build flag descriptions
        for (const flag of overload.Flags)
            flagDescs += `-${flag.Name}: ${flag.Description}`;
        
        let overloadText = `<b>${syntaxText} |</b> ${overload.Help}\n`;
        
        // Only show full parameter details in detailed view
        if (detailed) {
            overloadText += `\n<u>Parameters</u>\n${paramDescs != "" ? `${paramDescs}` : "None.\n"}`;
            overloadText += `\n<u>Flags</u>\n${flagDescs != "" ? `${flagDescs}` : "None.\n"}`;
        }

        overloadTexts.push(overloadText);
    }

    // Put bigger gaps between overload texts if we're in detailed view
    if (detailed)
        outputText += overloadTexts.join('\n\n');
    else
        outputText += overloadTexts.join('');

    WriteLine(outputText);
}

RegisterCommand(name, new Command(overloads, aliases));