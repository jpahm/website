"use strict";

export const Commands = {};
const Aliases = {};

/**
 * Registers a command's name and aliases for use in the terminal.
 * @param {String} name The primary name to register the command with. 
 * @param {Command} command The command object.
 */
export function RegisterCommand(name, command) {
    Commands[name] = command;
    for (const alias of command.Aliases)
        Aliases[alias] = command;
}

/**
 * Gets the command object associated with the given name.
 * @param {String} name The name of a command, or one of a command's aliases.
 * @returns {Command} The command.
 */
export function GetCommand(name) {
    if (Commands.hasOwnProperty(name))
        return Commands[name];
    else if (Aliases.hasOwnProperty(name))
        return Aliases[name];
    else
        throw new Error(`Command \"${tokens[0]}\" does not exist.`);
}

export class CommandFlag {
    /**
     * 
     * @param {String} name The name of the flag.
     * @param {String} description A description of what the flag represents, for help purposes.
     */
    constructor(name, description) {
        this.Name = name;
        this.Description = description;
    }
}

export class CommandParam {
    /**
     * 
     * @param {String} name The name of the parameter.
     * @param {String} description A description of what the parameter represents, for help purposes.
     * @param {Boolean} optional Whether this parameter shouldn't be required. Defaults to false.
     * @param {Boolean} variadic Whether this parameter consists of an arbitrarily long sequence of tokens rather than a single token. Defaults to false.
     * @param {(input: String | String[]) => any} parser The function responsible for parsing the string value of the parameter to the desired final type. 
     *      Takes in an array of string values if the parameter is variadic.
     */
    constructor(name, description, optional = false, variadic = false, parser = (input) => { return input; }) {
        this.Name = name;
        this.Description = description;
        this.Optional = optional;
        this.Variadic = variadic;
        this.Parser = parser;
    }
}

export class CommandOverload {
    /**
     * Creates a new overload for a terminal command.
     * @param {String} helpText Text describing what this overload does.
     * @param {CommandParam[]} params The parameters this overload expects.
     * @param {CommandFlag[]} flags The flags this overload expects.
     * @param {(params: object, flags: object) => void} executor The code that executes this overload's functionality. Receives parameters and flags as objects.
     */
    constructor(helpText, params = [], flags = [], executor = () => { }) {
        this.Help = helpText;
        this.Params = params;
        this.Flags = flags;
        this.Executor = executor;
    }
}

export class Command {
    /**
     * Creates a new terminal command.
     * @param {CommandOverload[]} overloads The overloads (implementations) of the command. 
     * @param {String[]} aliases Aliases to use for command lookup in addition to the command's registered name.
     * @param {boolean} hidden Whether this command should be hidden from the help menu.
    */
    constructor(overloads = [], aliases = [], hidden = false) {
        this.Overloads = overloads;
        this.Aliases = aliases;
        this.Hidden = hidden;
    }
}

/**
 * Tokenizes text for command processing.
 * @param {String} text The text to tokenize.
 */
export function Tokenize(text) {
    const tokens = [];

    let inString = false;
    let isEscaped = false;
    let buffer = [];

    for (const c of text) {
        // If we're not escaped and we encounter a quote, we need to start/end a string token
        if (!isEscaped && c == '"') {
            // If string flag set, we're ending a string; push token we've built so far excluding the quotes
            if (inString) {
                tokens.push(buffer.join(''));
                buffer = [];
            }
            // In either case, flip the string flag and continue to next char after quote
            inString = !inString;
            continue;
        }

        // If we're not already escaped, and we encounter a backslash, set escaped flag and continue to next char
        if (!isEscaped && c == '\\') {
            isEscaped = true;
            continue;
        }

        // Don't tokenize whitespace unless we're in a string -- instead, finish any in-progress tokens
        const isWhiteSpace = /\s/.test(c);
        if (!inString && isWhiteSpace) {
            if (buffer.length != 0) {
                tokens.push(buffer.join(''));
                buffer = [];
            }
            continue;
        }

        // Add current character to token builder
        buffer.push(c);

        // Reset escaped flag at end of char processing if set
        if (isEscaped)
            isEscaped = false;
    }

    // Add final token to tokens if in progress
    if (buffer.length != 0)
        tokens.push(buffer.join(''));

    return tokens;
}

/**
 * Executes the provided command given both raw and tokenized text from terminal input.
 * @param {Command} command The command to be executed.
 * @param {string} rawText The raw terminal input. Passed to the command as __rawText.
 * @param {string[]} tokens The tokenized input. Passed to the command as __tokens.
 */
export function ExecuteCommand(command, rawText, tokens) {
    const allTokens = tokens.slice(1); // Remove command name

    // Preprocess named and positional parameters from tokens for later parsing
    const named = {};
    const flags = {};
    const positional = [];

    for (let i = 0; i < allTokens.length; i++) {
        const token = allTokens[i];
        if (token.startsWith("--")) {
            const name = token.slice(2);
            // Grab all tokens between this named param and the next as values in case it ends up being a variadic param later
            let values = [];
            let j = i + 1;
            while (j < allTokens.length && !allTokens[j].startsWith("--")) {
                values.push(allTokens[j]);
                j++;
            }
            named[name] = values;
        } else if (token.startsWith("-")) {
            flags[token.slice(1)] = true;
        } 
        else {
            positional.push(token);
        }
    }

    let matchingOverload = null;
    let parsedParams = {};
    let parsedFlags = {};

    // Try each overload
    for (const overload of command.Overloads) {
        // Set the flags
        for (const flag of overload.Flags)
            parsedFlags[flag.Name] = flags.hasOwnProperty(flag.Name);

        // Build list of expected params based on matching precedence, keeping them in listed order if possible
        const expectedParams = [];
        // Explicitly named params first
        expectedParams.push(...overload.Params.filter((p) => named.hasOwnProperty(p.Name)));
        // Then required params
        expectedParams.push(...overload.Params.filter((p) => !p.Optional && !expectedParams.includes(p)));
        // Then optional non-variadic params
        expectedParams.push(...overload.Params.filter((p) => !p.Variadic && !expectedParams.includes(p)));
        // Then optional variadic params
        expectedParams.push(...overload.Params.filter((p) => !expectedParams.includes(p)));

        const paramMap = {};
        let success = true;
        let posCursor = 0;

        for (const param of expectedParams) {
            const name = param.Name;
            let rawValue = undefined;

            if (named.hasOwnProperty(name)) {
                rawValue = param.Variadic ? named[name] : named[name][0];
                posCursor += (param.Variadic ? rawValue.length : 1);
            } else if (param.Variadic) {
                rawValue = positional.slice(posCursor);
                posCursor = positional.length;
            } else if (posCursor < positional.length) {
                rawValue = positional[posCursor++];
            } else if (!param.Optional) {
                success = false;
                break;
            }

            if (rawValue !== undefined) {
                try {
                    paramMap[name] = param.Parser(rawValue);
                } catch (e) {
                    success = false;
                    break;
                }
            }
        }

        // Overload matches only if all required params parsed and no leftover positional tokens
        if (success && posCursor === positional.length) {
            matchingOverload = overload;
            parsedParams = paramMap;
            break;
        }
    }

    if (matchingOverload == null) {
        throw new Error(`No overload of command "${tokens[0]}" matches the provided parameters. Try running <b>help ${tokens[0]}</b>.`);
    }

    parsedParams.__rawText = rawText;
    parsedParams.__tokens = tokens;

    matchingOverload.Executor(parsedParams, parsedFlags);
}