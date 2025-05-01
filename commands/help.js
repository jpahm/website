"use strict";

import { registerCommand, getCommand, Command, commands, CommandOverload, CommandParam } from "../command.js";
import { writeLine } from "../terminal.js";

const name = "help";
const aliases = [];
const overloads = [

    new CommandOverload(
        `Displays this help menu.`,
        [],
        [],
        () => {
            // List basic help info for all commands alphabetically
            for (let commandName of Object.keys(commands).sort())
                if (!commands[commandName].hidden)
                    writeHelpInfo(commands[commandName], false);
        }
    ),

    new CommandOverload(
        `Displays detailed help information for the specified command.`,
        [
            new CommandParam("commandName", `The name of the command to get detailed help for.`)
        ],
        [],
        ({commandName}) => {
            let cmd = getCommand(commandName);
            if (cmd == undefined) {
                throw new Error(`Command \"${commandName}\" does not exist.`);
            }
            writeHelpInfo(cmd, true);
        }
    )

];

/**
 * Writes help info for the specified command to the terminal.
 * @param {Command} cmd The command to get help info for. 
 * @param {boolean} detailed Whether to show detailed help info. Defaults to false.
 */
function writeHelpInfo(cmd, detailed = false) {
    const cmdName = cmd.name;
    let outputText = "";
    // List the aliases in detailed view
    if (detailed) {
        outputText += `<u><b>HELP FOR: ${cmdName}</b></u>`;
        if (cmd.aliases.length > 0)
            outputText += `\n<b>Aliases:</b> ${cmd.aliases.join(', ')}\n\n`;
        else
            outputText += "\n\n";
    }
    // Only show first 2 overloads if not in detailed view
    const includedOverloads = detailed ? cmd.overloads : cmd.overloads.slice(0, 3);

    // Write help text for each of a command's overloads
    const overloadTexts = [];
    for (const overload of includedOverloads) {
        let syntaxText = `${cmdName}`;
        let paramDescs = "";
        let flagDescs = "";
        // Build the syntax text and param descriptions from the overload's params
        for (const param of overload.params) {
            const v = param.variadic ? '...' : '';
            syntaxText += param.optional ? ` [${param.name}${v}]` : ` &lt;${param.name}${v}&gt;`;
            paramDescs += `--${param.name}: ${param.description} ${param.optional ? '<b>(OPTIONAL)</b>' : ''}\n`;
        }

        // Build flag descriptions
        for (const flag of overload.flags)
            flagDescs += `-${flag.name}: ${flag.description}\n`;
        
        let overloadText = `<b>${syntaxText} |</b> ${overload.helpText}\n`;
        
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

    writeLine(outputText);
}

registerCommand(name, new Command(overloads, aliases));