"use strict";

import { Tokenize, GetCommand, ExecuteCommand } from "./command.js";
import "./commands/init.js";

export const Version = "0.2.0";
export const Terminal = document.getElementById("terminal");
export const InputArea = document.getElementById("terminal-input");
export const Prefix = document.getElementById("prefix");

// Global variable storage
export const Variables = {};

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
        default:
            // Don't flag that we used history if we edited the input
            HistoryFlag = false;
    }
});

function LoadPath(path) {
    CurrentPath = path;
    SetPrefix(`cmd:${CurrentPath}>`);
    // TODO: Add actual filesystem simulation
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
 * @param {String} text The text to be written.
 * @param {boolean} writeAsHTML Whether to treat the text as HTML. Defaults to true.
 * @returns {HTMLParagraphElement} The node that was written to the terminal.
 */
function Write(text, writeAsHTML = true) {
    // Create new paragraph node and style it accordingly
    const textNode = document.createElement("p");
    // Replace newlines with break tags
    text = text.replace(/\n/g, "<br/>");
    if (writeAsHTML)
        textNode.innerHTML = text;
    else
        textNode.textContent = text;
    WriteRaw(textNode);
    return textNode;
}

/**
 * Writes to the terminal's output, adding a line break afterwards.
 * @param {String} text The text to be written.
 * @param {boolean} writeAsHTML Whether to treat the text as HTML. Defaults to true.
 * @returns {HTMLParagraphElement} The node that was written to the terminal.
 */
export function WriteLine(text, writeAsHTML = true) {
    let writtenNode = Write(text, writeAsHTML);
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
    try {
        // Remove leading/trailing whitespace
        const trimmed = rawInput.trim();

        // Ignore empty inputs
        if (trimmed.length == 0)
            return;

        // If we didn't use history, reset history position to end
        if (!HistoryFlag)
            HistoryIdx = -1;

        // Add input to history stack
        CmdHistory.push(trimmed);
        HistoryFlag = false;

        // Do variable substitution before tokenization
        const substituted = trimmed.replace(/\$\((.*)\)|(\$[A-z]+)/g, (_, group, name) => {
            const toSub = String(group ?? name).replace(/\$([A-z]+)/g, "Variables.$1");
            // We can safely do eval here because the entire site is clientside anyways :)
            return JSON.stringify(eval(`"use strict";(${toSub})`));
        });

        // Tokenize text, then find and run command
        let tokens = Tokenize(substituted);
        let commandToRun = GetCommand(tokens[0]);
        ExecuteCommand(commandToRun, substituted, tokens);

        // Keep input area in view after command output
        InputArea.scrollIntoView(true);
    } 
    catch (error) {
        WriteLine(`<span class="error">${error.name}:</span> ${error.message}`)
    }
}

Initialize();