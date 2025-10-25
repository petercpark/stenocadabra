"use strict";

// Compiled typescript file from https://github.com/ServerBBQ/javelin-webtools/blob/main/lib/javelinHidDevice.ts
// Documentation is here: https://github.com/ServerBBQ/javelin-webtools/blob/main/README.md#documentation

export function isHidSupported() {
    return !!navigator?.hid;
}

const options = {
    filters: [
        {
            usagePage: 65329,
            usage: 116
        },
    ],
};
// My documentation of the Javelin event system, TODO, move or delete this
// e: event
//   p: paper tape
//     o: outline
//     d: dictionary
//     t: translation
//   c: script // script events like layer changes
//     t: text
//   b: button_state // when pressing down buttons
//     d: data
//   s: suggestion
//     c: combined, how many strokes the suggestion covers(last x strokes)
//     t: translation
//     o: array of outlines
//   v: template value // when setting a template value
//     i: index
//     v: value
//   l: serial // when communicating over serial, used for serial bridge
//     d: data
//   d: dictionary status
//     d: dictionary
//     v: value, 1 or 0, 0 means disabled 1 means enabled
//   t: text // The text of the stuff typed in steno, used for wpm tool
//     t: text
//  
//
// static constexpr const char *EVENT_NAMES[] = {
//     "button_state",      //
//     "dictionary_status", //
//     "paper_tape",        //
//     "script",            //
// #if JAVELIN_BLE
//     "serial", //
// #endif
//     "suggestion",     //
//     "template_value", //
//     "text",           //
//     "analog_data",    //
// };
//
// EV {"e":"b","d":"AAAAAAAAAAA="} // button state
// EV {"e":"d","d":"user.json","v":0} // dictionary status
// EV {"e":"p","o":"TH","d":"main.json","t":"this"} // paper tape
// EV {"e":"c","t":"layer_id: 87377230"} // script I think
// EV {"e":"l","d":"BAA="} // serial
// EV {"e":"s","c":2,"t":"this is","o":["TH-S","STKHE","STKH-B"]} // suggestion
// EV {"e":"v","i":0,"v":"test"} // template value
// EV {"e":"t","t":" Test"} // text
// List of events that should trigger `enable_events`
const JAVELIN_EVENT_NAMES = [
    "button_state",
    "dictionary_status",
    "paper_tape",
    "script",
    "serial",
    "suggestion",
    "template_value",
    "text",
    "analog_data",
];
export const JavButtonStateAliases = {
    d: { key: "keys", type: "boolean[]" },
};
const JavDictStatusAliases = {
    d: { key: "dictionary", type: "string" },
    v: { key: "enabled", type: "boolean" },
};
const JavPaperTapeAliases = {
    o: { key: "outline", type: "string" },
    d: { key: "dictionary", type: "string" },
    t: { key: "translation", type: "string" },
};
const JavScriptAliases = {
    t: { key: "text", type: "string" },
};
const JavTemplateValueAliases = {
    i: { key: "index", type: "number" },
    v: { key: "value", type: "string" },
};
const JavSerialAliases = {
    d: { key: "data", type: "string" },
};
const JavSuggestionAliases = {
    c: { key: "strokes", type: "number" },
    t: { key: "translation", type: "string" },
    o: { key: "outlines", type: "string[]" },
};
const JavTextAliases = {
    t: { key: "text", type: "string" },
};
const JavAnalogDataAliases = {};
/**
 * Used to convert the Javelin event into a human readable one
 */
const JavAliasToEventName = {
    b: 'button_state',
    d: 'dictionary_status',
    p: 'paper_tape',
    c: 'script',
    l: 'serial',
    s: 'suggestion',
    v: 'template_value',
    t: 'text',
    a: 'analog_data',
};
const JavAliases = {
    b: JavButtonStateAliases,
    d: JavDictStatusAliases,
    p: JavPaperTapeAliases,
    c: JavScriptAliases,
    l: JavSerialAliases,
    s: JavSuggestionAliases,
    v: JavTemplateValueAliases,
    t: JavTextAliases,
    a: JavAnalogDataAliases,
};
/**
 * Decodes a Base64-encoded string into a boolean array representing bits.
 * Each bit of the decoded bytes becomes one element in the array:
 *   - true  = bit is set (1)
 *   - false = bit is clear (0)
 * The first bit of the first byte is the first element of the array, etc.
 */
export function decodeBase64ToBoolArray(data) {
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const bits = [];
    for (const byte of bytes) {
        for (let i = 0; i < 8; i++) {
            bits.push((byte & (1 << i)) !== 0);
        }
    }
    return bits;
}
/** Convert a raw event object to a typed, human-readable object */
export function decodeJavEvent(ev) {
    const eventKey = JavAliasToEventName[ev.e];
    if (!eventKey)
        return null;
    // Check if this event has aliases we know how to parse
    if (!(ev.e in JavAliases))
        return null;
    const aliases = JavAliases[ev.e];
    // Build as a plain record first
    const detailRecord = { raw: JSON.stringify(ev) };
    function coerceValue(value, type) {
        if (value === null || value === undefined) {
            if (type === "boolean[]")
                return [];
            if (type === "string[]")
                return [];
            return value;
        }
        switch (type) {
            case "boolean":
                if (value === "1" || value === 1 || value === "true")
                    return true;
                if (value === "0" || value === 0 || value === "false")
                    return false;
                return Boolean(value);
            case "boolean[]":
                if (typeof value === "string")
                    return decodeBase64ToBoolArray(value);
                return Array.isArray(value) ? value.map(Boolean) : [];
            case "number":
                return typeof value === "string" && /^\d+$/.test(value)
                    ? Number(value)
                    : value;
            case "string":
                return String(value);
            case "string[]":
                return Array.isArray(value) ? value.map(String) : [];
            default:
                return value;
        }
    }
    for (const [key, value] of Object.entries(ev)) {
        if (key === "e")
            continue;
        const alias = aliases[key];
        if (!alias)
            continue;
        const coerced = coerceValue(value, alias.type);
        detailRecord[alias.key] = coerced;
    }
    // Final cast: detailRecord -> concrete event type
    return {
        event: eventKey,
        detail: detailRecord,
    };
}
/**
 *  Manages a single Javelin HID device in the browser using the WebHID API.
 */
export class JavelinHidDevice extends EventTarget {
    constructor() {
        super();
        /** The underlying HIDDevice, or null if not connected. */
        this.device = null;
        /** Whether the device is currently connected. */
        this.connected = false;
        /**
         * The id given by the `hello` console command
         */
        this.connectionId = undefined;
        // -----------------------
        // Typed event API (for IDE autocomplete)
        // -----------------------
        this.enabledEvents = [];
        // Event listening
        this.eventDecoder = new TextDecoder();
        this.eventBuffer = "";
        if (!navigator?.hid) {
            return;
        }
        // Listen for devices being plugged in
        navigator.hid.addEventListener("connect", async (event) => {
            if (this.connected) {
                return;
            }
            ;
            // Ignore devices whose usage page/usage don't match our filters
            if (!event.device.collections.some(c => options.filters.some(f => c.usagePage === f.usagePage && (!f.usage || c.usage === f.usage)))) {
                return;
            }
            this.device = event.device;
            await this.setupDevice();
            this.connected = true;
            this.emit("connected", event.device);
        });
        // Listen for devices being unplugged
        navigator.hid.addEventListener("disconnect", (event) => {
            if (this.device && this.device === event.device) {
                this.device = null;
                this.connected = false;
                this.emit("disconnected", event.device);
            }
        });
        this.checkForConnections();
    }
    /**
     * Prompts the user to select a Javelin HID device using WebHID.
     *
     * @param save - If true, persist the selected device info (e.g. in localStorage) for reconnecting later.
     * @returns The selected HIDDevice, or null if no device was chosen.
     */
    async connect() {
        const devices = await navigator.hid.requestDevice(options);
        if (!devices || devices.length === 0) {
            console.warn("No device selected.");
            return null;
        }
        const device = devices[0];
        this.device = device;
        await this.setupDevice();
        this.connected = true;
        this.emit("connected", this.device);
        return device;
    }
    /**
     * Sends a command to the device as a string and waits for a string response.
     *
     * @param command - The command string to send
     * @param timeout - Optional timeout in ms
     * @returns A Promise that resolves to the response string from the device
      * @example
      * ```ts
      * // Basic usage
      * const response = await device.sendCommand("help");
      * console.log(response);
      *
      * // With a custom timeout
      * const response2 = await device.sendCommand("info", 2000);
      * console.log(response2);
      * ```
     */
    async sendCommand(command, timeout) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const header = this.connectionId ? this.connectionId + " " : "";
        const headerBytes = encoder.encode(header);
        const commandBytes = encoder.encode(command + "\n");
        let timer;
        return new Promise(async (resolve, reject) => {
            if (!this.device)
                throw new Error("No device connected");
            if (!this.device.opened)
                await this.openDeviceWithRetry();
            let responseBuffer = "";
            let collecting = false; // Start collecting only after we see our connectionId
            if (!this.connectionId) {
                collecting = true; // Collect always if no connection id set
            }
            const handler = (event) => {
                if (event.reportId === 0) {
                    const chunk = decoder.decode(new Uint8Array(event.data.buffer));
                    responseBuffer += chunk;
                    // Only start collecting once we see the connection id
                    if (!collecting) {
                        const marker = this.connectionId + " ";
                        const idx = responseBuffer.indexOf(marker);
                        if (idx !== -1) {
                            // Trim everything up to and including the connection id
                            responseBuffer = responseBuffer.slice(idx + marker.length);
                            collecting = true;
                        }
                        else {
                            // Haven’t seen our connectionId yet, ignore this chunk
                            responseBuffer = "";
                            return;
                        }
                    }
                    // Check for double newline
                    if (responseBuffer.includes("\n\n")) {
                        this.device?.removeEventListener("inputreport", handler);
                        // trim responceBuffer
                        responseBuffer = responseBuffer.split("\n\n")[0];
                        responseBuffer = responseBuffer.replace(/^\x00+/, ''); // Strip null characters
                        resolve(responseBuffer);
                        clearTimeout(timer);
                        this.device?.removeEventListener("inputreport", handler);
                    }
                }
            };
            this.device.addEventListener("inputreport", handler);
            const splitCommandBytes = splitUint8Array(commandBytes, 63 - headerBytes.length);
            for (const commandBytesChunk of splitCommandBytes) {
                const fullPacket = new Uint8Array(63);
                fullPacket.set(headerBytes, 0);
                fullPacket.set(commandBytesChunk, headerBytes.length);
                this.device.sendReport(0, fullPacket).catch((err) => {
                    this.device?.removeEventListener("inputreport", handler);
                    reject(err);
                });
            }
            if (timeout && timeout > 0) {
                timer = setTimeout(() => {
                    this.device?.removeEventListener("inputreport", handler);
                    reject(new Error("Command timed out"));
                }, timeout);
            }
        });
    }
    async getConnectionId() {
        const helloOutput = await this.sendCommand("hello");
        const id = helloOutput.slice(0, 3);
        if (!id.match(/^c\d\d$/)) {
            console.warn("Error getting connection ID. Output from hello command:", helloOutput);
            return null;
        }
        this.connectionId = id;
        return id;
    }
    on(eventType, listener, options) {
        // Enable event in Javelin if needed
        if (JAVELIN_EVENT_NAMES.includes(eventType)) {
            if (!this.enabledEvents.includes(eventType)) {
                this.enabledEvents.push(eventType);
            }
            if (this.connected) {
                this.sendCommand(`enable_events ${eventType}`).catch(err => {
                    console.warn(`Failed to enable event ${eventType}:`, err);
                });
            }
        }
        // Register event listener
        super.addEventListener(eventType, listener, options);
    }
    off(type, listener, options) {
        super.removeEventListener(type, listener, options);
    }
    emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }));
    }
    /**
     * Checks for previously authorized HID devices that match the specified filters
     * and automatically selects one if exactly one matches.
    */
    async checkForConnections() {
        const devices = await navigator.hid.getDevices();
        // Filter to devices that match usagePage
        const matchingDevices = devices.filter((d) => d.collections.some((c) => options.filters.some((f) => c.usagePage === f.usagePage && (!f.usage || c.usage === f.usage))));
        if (matchingDevices.length == 1) {
            this.device = matchingDevices[0];
            await this.setupDevice();
            this.connected = true;
            this.emit("connected", this.device);
        }
    }
    // Call once after device is connected/opened
    startEventListener() {
        if (!this.device)
            return;
        const handler = (event) => {
            if (event.reportId !== 0)
                return;
            const chunk = this.eventDecoder.decode(new Uint8Array(event.data.buffer));
            this.eventBuffer += chunk;
            // Split into complete lines
            const lines = this.eventBuffer.split("\n");
            this.eventBuffer = lines.pop() ?? ""; // save incomplete tail
            for (const rawLine of lines) {
                const line = rawLine.replace(/^\x00+/, ''); // This caused so much debugging
                if (line.startsWith("EV ")) {
                    const jsonPart = line.slice(3).trim();
                    try {
                        const ev = JSON.parse(jsonPart);
                        const decoded = decodeJavEvent(ev);
                        if (decoded) {
                            this.emit(decoded.event, decoded.detail);
                        }
                        else {
                            console.warn("Failed to parse EV JSON:", ev);
                        }
                    }
                    catch (err) {
                        console.warn("Failed to parse EV JSON:", jsonPart, err);
                    }
                }
            }
        };
        this.device.addEventListener("inputreport", handler);
    }
    async openDeviceWithRetry(retryInterval = 100) {
        if (!this.device)
            return;
        while (!this.device.opened) {
            try {
                await this.device.open();
                // Successfully opened, exit the loop
                break;
            }
            catch (err) {
                const e = err;
                if (e.name === "InvalidStateError") {
                    // Device is busy, wait a bit and retry
                    await new Promise((resolve) => setTimeout(resolve, retryInterval));
                }
                else {
                    // Other errors should propagate
                    throw e;
                }
            }
        }
    }
    async setupDevice() {
        // Open device if not opened
        await this.openDeviceWithRetry();
        if (!this.connectionId) {
            await this.getConnectionId();
        }
        // Enable events
        this.startEventListener();
        if (this.enabledEvents.length > 0) {
            this.sendCommand(`enable_events ${this.enabledEvents.join(" ")}`).catch(err => {
                console.warn("Failed enabling events:", err);
            });
        }
    }
}
function splitUint8Array(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}