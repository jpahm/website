"use strict";

const Version = "0.1.0";
const Terminal = document.getElementById("terminal");
const InputArea = document.getElementById("terminal-input");
const Prefix = document.getElementById("prefix");

// History
const CmdHistory = [];
var HistoryIdx = -1;
var HistoryFlag = false;

// Filesystem
var CurrentPath = null;

function Initialize() {
    LoadPath("/");
    WriteLine(`Website [Version ${Version}]`);
    WriteLine("(c) <a href='https://linkedin.com/in/jpahm' style='color:#abcdef; font-weight:bold'>Josh Pahman</a> 2025. No rights reserved.");
    WriteBreak();
}

// Focus on terminal when the page gets clicked
document.addEventListener("click", () => {
    InputArea.focus();
});

// Re-render prefix on viewport resize to scale properly
visualViewport.addEventListener("resize", () => {
    SetPrefix(Prefix.value);
})

// Handle keypresses in the terminal
InputArea.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "Enter":
            // Write to stdout on enter
            e.preventDefault();
            HandleEnter();
            break;
        case "ArrowUp":
            e.preventDefault();
            HistoryBack();
            break;
        case "ArrowDown":
            e.preventDefault();
            HistoryForward();
            break;
    }
});

function LoadPath(path) {
    CurrentPath = path;
    SetPrefix(`cmd:${CurrentPath}>`);
}

function LoadFile(filename) {

}

/** Goes backward in the command history. */
function HistoryBack() {
    if (HistoryIdx == -1) {
        if (CmdHistory.length > 0)
            HistoryIdx = CmdHistory.length - 1;
        else
            return;
    }
    else if (HistoryFlag) {
        HistoryIdx = Math.max(0, HistoryIdx - 1);
    }
    InputArea.value = CmdHistory[HistoryIdx];
    HistoryFlag = true;
}

/** Goes forward in the command history. */
function HistoryForward() {
    if (HistoryIdx == -1)
        return;
    else
        HistoryIdx = Math.min(CmdHistory.length, HistoryIdx + 1);

    InputArea.value = CmdHistory[HistoryIdx] || "";
    HistoryFlag = true;
}

/**
 * Changes the terminal prefix and scales the terminal accordingly.
 * @param {*} newPrefix The new terminal prefix to use.
 */
function SetPrefix(newPrefix) {
    Prefix.style.width = `${newPrefix.length}ch`;
    InputArea.style.width = `${(visualViewport.width - Prefix.clientWidth)/visualViewport.width * 100 - 4}%`;
    Prefix.value = newPrefix;
}

/**
 * Writes an HTML node directly to the terminal.
 * @param {*} node The node to write.
 */
function WriteRaw(node) {
    Terminal.insertBefore(node, Prefix);
}

/** Writes a line break to the terminal. */
function WriteBreak() {
    WriteRaw(document.createElement("br"));
}

/**
 * Writes to the terminal's output.
 * @param {String} text The text to be written. Can include HTML.
 * @param {boolean} renderHTML Whether HTML in the text will be rendered or not.
 * @returns {HTMLParagraphElement} The paragraph element that was written to the terminal.
 */
function Write(text, renderHTML = true) {
    // Create new paragraph node and style it accordingly
    const textNode = document.createElement("p");
    // Replace newlines with break tags
    text = text.replace(/\n/g, "<br/>");
    if (renderHTML)
        textNode.innerHTML = text;
    else
        textNode.textContent = text;
    WriteRaw(textNode);
    return textNode;
}

/**
 * Writes to the terminal's output, adding a break afterwards.
 * @param {String} text The text to be written. Can include HTML.
 * @param {boolean} renderHTML Whether HTML in the text will be rendered or not.
 * @returns {HTMLParagraphElement} The paragraph element that was written to the terminal.
 */
function WriteLine(text, renderHTML = true) {
    let writtenNode = Write(text, renderHTML);
    WriteBreak();
    return writtenNode;
}

/** Handles processing text when the enter key is pressed. */
function HandleEnter() {
    // Write raw input (including prefix) to linebuf
    WriteLine(Prefix.value + InputArea.value, false);
    // Process the terminal input
    ProcessInput(InputArea.value);
    // Clear input and refocus
    InputArea.value = "";
    InputArea.focus();
}

/**
 * Attempts to find and run a command given raw user input.
 * @param {String} rawInput The user's raw text input.
 */
function ProcessInput(rawInput) {
    // Remove leading/trailing whitespace
    const trimmed = rawInput.trim();
    // Ignore empty inputs
    if (trimmed.length == 0)
        return;
    // Add input to history stack
    CmdHistory.push(trimmed);
    HistoryFlag = false;
    // Find/Run command
    let tokens = Tokenize(trimmed);
    let cmd = Commands[tokens[0]];
    if (cmd == undefined)
        WriteLine(`<span class="error">ERROR:</span> Command \"${tokens[0]}\" does not exist.`);
    else
        cmd.Execute(tokens);

    // Keep input area in view
    InputArea.scrollIntoView(true);
}

////////// COMMANDS //////////

const Commands = {};

/**
 * Tokenizes text for command processing.
 * @param {*} text The text to tokenize.
 */
function Tokenize(text) {
    const tokens = [];

    let inString = false;
    let isEscaped = false;
    let curToken = "";

    for (const c of text) {
        // If we're not escaped and we encounter a quote, we need to start/end a string token
        if (!isEscaped && c == '"') {
            // If string flag set, we're ending a string; push token we've built so far excluding the quotes
            if (inString) {
                tokens.push(curToken);
                curToken = "";
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
            if (curToken != "") {
                tokens.push(curToken);
                curToken = "";
            }
            continue;
        }

        // Add current character to token builder
        curToken += c;

        // Reset escaped flag at end of char processing if set
        if (isEscaped)
            isEscaped = false;
    }

    // Add final token to tokens if in progress
    if (curToken != "")
        tokens.push(curToken);

    return tokens;
}

class CommandParam {
    constructor(name, description, optional = false, parser = (token) => {return token;}) {
        this.Name = name;
        this.Description = description;
        this.Optional = optional;
        this.Parser = parser;
    }
}

class CommandOverload {
    constructor(helpText, params = [], executor = (params) => {}) {
        this.Help = helpText;
        this.Params = params;
        this.Executor = executor;
    }
}

class Command {
    Execute = (tokens) => {
        const cmdName = tokens[0];
        const paramTokens = tokens.slice(1);
        const namedParams = {};
        const positionalParams = [];

        // Find both named and positional params
        let paramName = null;
        for (let token of paramTokens) {
            if (token.startsWith("--")) {
                paramName = token.substr(2);
                continue;
            } else if (paramName != null) {
                namedParams[paramName] = token;
                paramName = null;
            } else {
                positionalParams.push(token);
            }
        }

        const numParams = positionalParams.length + Object.keys(namedParams).length;

        // Try all overloads until we find a matching one or fail; parse params as we go
        let matchingOverload = null;
        const parsedParams = {};
        for (let overload of this.Overloads) {

            // Detect too many or too few params
            let requiredParams = overload.Params.filter((p) => !p.Optional);
            if (numParams < requiredParams.length || numParams > overload.Params.length)
                continue;

            // Look through all parameters and attempt to match until a required parameter can't be found
            let matches = true;
            let positionalIdx = 0;
            for (let param of overload.Params) {
                let name = param.Name;
                if (namedParams[name] != undefined) { // First, try to find as a named param
                    parsedParams[name] = param.Parser(namedParams[name]);
                } else if (positionalIdx < positionalParams.length) { // Fallback by assuming param is positional
                    parsedParams[name] = param.Parser(positionalParams[positionalIdx++]);
                } else if (!param.Optional) { // We've failed to find the parameter -- fail this overload match if it isn't optional
                    matches = false;
                    break;
                }
            }
            if (matches) {
                matchingOverload = overload;
                break;
            }
        }

        // Handle the case where no overloads match
        if (matchingOverload == null) {
            WriteLine(`<span class="error">ERROR:</span> No overload of command \"${cmdName}\" matches the provided parameters. Try running <b>help ${cmdName}</b>.`)
            return;
        }

        // Pass the parsed params to the overload's executor to run the command
        matchingOverload.Executor(parsedParams);
    }
    constructor(overloads = []) {
        this.Overloads = overloads;
    }
}

// Help

function WriteHelpInfo(cmdName, detailed = false) {
    const cmd = Commands[cmdName];
    let outputText = `${detailed ? `<u><b>HELP FOR: ${cmdName}</b></u>\n\n` : ''}`;
    // Only show first 2 overloads if not in detailed view
    const includedOverloads = detailed ? cmd.Overloads : cmd.Overloads.slice(0, 3);

    // Write help text for each of a command's overloads
    const overloadTexts = [];
    for (const overload of includedOverloads) {
        let syntaxText = `${cmdName}`;
        let paramDescs = "";
        // Build the syntax text and param descriptions from the overload's params
        for (const param of overload.Params) {
            syntaxText += param.Optional ? ` [${param.Name}]` : ` &lt;${param.Name}&gt;`;
            paramDescs += `--${param.Name}: ${param.Description} ${param.Optional ? '<b>(OPTIONAL)</b>' : ''}\n`;
        }
        
        let overloadText = `<b>${syntaxText} |</b> ${overload.Help}\n`;
        
        // Only show full parameter details in detailed view
        if (detailed)
            overloadText += `\n<u>Parameters</u>\n${paramDescs != "" ? `${paramDescs}` : "None."}`;

        overloadTexts.push(overloadText);
    }

    // Put bigger gaps between overload texts if we're in detailed view
    if (detailed)
        outputText += overloadTexts.join('\n\n\n');
    else
        outputText += overloadTexts.join('');

    WriteLine(outputText);
}

Commands.help = new Command([
    new CommandOverload(
        `Displays this help menu.`,
        [],
        () => {
            for (let commandName in Commands)
                WriteHelpInfo(commandName, false);
        }
    ),
    new CommandOverload(
        `Displays detailed help information for the specified command.`,
        [
            new CommandParam("command", `The name of the command to get detailed help for.`)
        ],
        ({command}) => {
            let cmd = Commands[command];
            if (cmd == undefined) {
                WriteLine(`<span class="error">ERROR:</span> Command \"${command}\" does not exist.`);
                return;
            }
            WriteHelpInfo(command, true);
        }
    )
]);

// Clear

Commands.clear = new Command([
    new CommandOverload(`Clears the terminal.`, [], () => {
        const childArray = Array.from(Terminal.children);
        const removableChildren = childArray.filter((c) => c.tagName != "TEXTAREA");
        for (const child of removableChildren)
            child.remove();
    })
]);

// Echo

Commands.echo = new Command([
    new CommandOverload(`Outputs the provided text into the terminal.`, 
    [
        new CommandParam("text", "The text to echo.")
    ], ({text}) => {
        WriteLine(text);
    })
]);

// Color

Commands.color = new Command([
    new CommandOverload(`Sets the background and the text color of the terminal.`, 
    [
        new CommandParam("background", "The background color. Can be a word, rgb value, or hex code.", true),
        new CommandParam("text", "The text color. Can be a word, rgb value, or hex code.", true)
    ], ({background, text}) => {
        document.getElementsByTagName('html')[0].style.backgroundColor = background;
        if (text != undefined)
            Terminal.style.color = text;
    })
]);

// Cat

Commands.cat = new Command([
    new CommandOverload(`Opens a file.`, 
    [
        new CommandParam("path", "A local or remote path to the file."),
    ], ({path}) => {
        WriteLine(`<iframe src='${path}' style='width: ${Prefix.clientWidth + InputArea.clientWidth}px; height: 20em; background-color:white'></iframe>`)
    })
]);

// TODO: ls/dir (just cat the current dir)
// TODO: cd (change current dir)

Initialize();