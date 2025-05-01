"use strict";

import { tokenize, getCommand, executeCommand, commands } from "./command.js";
import "./commands/index.js";

const version = "0.2.2";
export const terminal_element = document.getElementById("terminal");
export const input_element = document.getElementById("terminal-input");
export const prefix_element = document.getElementById("prefix");

// Global variable storage
export const variables = {};

// History
const cmdHistory = [];
var historyIdx = -1;
var historyFlag = false;

// WIP Filesystem
var currentPath = null;

// WIP User data
var currentUser = 'anon';

function boot() {
    // Make commands available as variable '$commands'
    variables.commands = commands;
    loadPath("/");
    writeLine(`
        Website [Version ${version}]
        (c) <b>Josh Pahman</b> 2025. No rights reserved.

        <span style="color:#6A9955">/**
        
        Hey, welcome to my website! This is a web-based CLI written entirely by hand with <b>no dependencies.</b>
        HTML can be written directly to the terminal and JavaScript expressions are supported via \${{EXPRESSION}}.
        
        I hope you enjoy; check out my <a style='color:inherit' href='https://linkedin.com/in/jpahm'>LinkedIn</a> and <a style='color:inherit' href='https://github.com/jpahm'>Github</a> while you're here!
        
        **/</span>\n
    `);
}

// Focus on terminal when the page gets clicked
document.addEventListener("click", () => {
    input_element.focus();
});

// Re-render prefix on viewport resize to scale properly
visualViewport.addEventListener("resize", () => {
    setPrefix(prefix_element.value);
})

// Handle keypresses in the terminal
input_element.addEventListener("keydown", (e) => {
    input_element.placeholder = "";
    switch (e.key) {
        case "Enter":
            // Write to stdout on enter
            e.preventDefault();
            onEnter();
            break;
        case "ArrowUp":
            e.preventDefault();
            historyBack();
            break;
        case "ArrowDown":
            e.preventDefault();
            historyForward();
            break;
        default:
            // Don't flag that we used history if we edited the input
            historyFlag = false;
    }
});

/** Handles processing text when the enter key is pressed. */
function onEnter() {
    // Write raw input (including prefix) to linebuf
    writeLine(prefix_element.value + input_element.value, false);
    // Process the terminal input
    processInput(input_element.value);
    // Clear input, refocus, and keep it in view
    input_element.value = "";
    input_element.focus();
    input_element.scrollIntoView(true);
}

/** Goes backward in the command history. */
function historyBack() {
    if (historyIdx == -1) {
        if (cmdHistory.length > 0)
            historyIdx = cmdHistory.length - 1;
        else
            return;
    }
    else if (historyFlag) {
        historyIdx = Math.max(0, historyIdx - 1);
    }
    input_element.value = cmdHistory[historyIdx];
    historyFlag = true;
}

/** Goes forward in the command history. */
function historyForward() {
    if (historyIdx == -1)
        return;
    else
        historyIdx = Math.min(cmdHistory.length, historyIdx + 1);

    input_element.value = cmdHistory[historyIdx] || "";
    historyFlag = true;
}

function loadPath(path) {
    currentPath = path;
    setPrefix(`${currentUser}:${currentPath}>`);
    // TODO: Add actual filesystem simulation
}

/**
 * Changes the terminal prefix and scales the terminal accordingly.
 * @param {String} newPrefix The new terminal prefix to use.
 */
function setPrefix(newPrefix) {
    prefix_element.style.width = `${newPrefix.length}ch`;
    input_element.style.width = `${(visualViewport.width - prefix_element.clientWidth)/visualViewport.width * 100 - 4}%`;
    prefix_element.value = newPrefix;
}

/**
 * Writes an HTML node directly to the terminal.
 * @param {*} node The node to write.
 */
function writeNode(node) {
    terminal_element.insertBefore(node, prefix_element);
}

/** Writes a line break to the terminal. */
function writeBreak() {
    writeNode(document.createElement("br"));
}

/**
 * Writes to the terminal's output.
 * @param {String} text The text to be written.
 * @param {boolean} writeAsHTML Whether to treat the text as HTML. Defaults to true.
 * @returns {HTMLParagraphElement} The node that was written to the terminal.
 */
function write(text, writeAsHTML = true) {
    // Create new paragraph node and style it accordingly
    const textNode = document.createElement("p");
    if (writeAsHTML) {
        text = text.replace(/\n/g, "<br/>");
        textNode.innerHTML = text;
    }
    else {
        textNode.textContent = text;
    }
    writeNode(textNode);
    return textNode;
}

/**
 * Writes to the terminal's output, adding a line break afterwards.
 * @param {String} text The text to be written.
 * @param {boolean} writeAsHTML Whether to treat the text as HTML. Defaults to true.
 * @returns {HTMLParagraphElement} The node that was written to the terminal.
 */
export function writeLine(text, writeAsHTML = true) {
    let writtenNode = write(text, writeAsHTML);
    writeBreak();
    return writtenNode;
}

/**
 * Safely clears the terminal.
 */
export function clearScreen() {
    const childArray = Array.from(terminal_element.children);
    const removableChildren = childArray.filter((c) => c.tagName != "TEXTAREA");
    for (const child of removableChildren)
        child.remove();
}

/**
 * Attempts to find and run a command given raw user input.
 * @param {String} rawInput The user's raw text input.
 */
function processInput(rawInput) {
    try {
        // Remove leading/trailing whitespace
        const trimmed = rawInput.trim();

        // Ignore empty inputs
        if (trimmed.length == 0)
            return;

        // If we didn't use history, reset history position to end
        if (!historyFlag)
            historyIdx = -1;

        // Add input to history stack
        cmdHistory.push(trimmed);
        historyFlag = false;

        // Do variable substitution before tokenization
        const substituted = trimmed.replace(/\\?(?:\$\{\{((?:[^\\}]|\\.|}(?!}))*?)\}\}|(\$[\w_][\w\d_]*))/g, (match, group, name) => {
            // Allow for escaping substitution
            if (match.startsWith('\\'))
                return match.slice(1);
            const toSub = String(group ?? name).replace(/\$([\w_][\w\d_]*)/g, "$1");
            const val = contextualEval(toSub, variables);
            if (typeof val === 'object')
                return JSON.stringify(val);
            else
                return val;
        });

        // Tokenize text, then find and run command
        let tokens = tokenize(substituted);
        let commandToRun = getCommand(tokens[0]);
        executeCommand(commandToRun, substituted, tokens);
    } 
    catch (error) {
        writeLine(`<span class="error">${error.name}:</span> ${error.message}`)
    }
}

/**
 * Perform 'safe' evaluation of a javascript expression given a context object containing the variables to expose.
 * @param {String} expr The expression to evaluate.
 * @param {object} context Object containing the variables to expose to the evaluated expression.
 * @returns 
 */
export function contextualEval(expr, context) {
    return Function(...Object.keys(context), `"use strict"; return (${expr})`)
           (...Object.values(context));
}

boot();