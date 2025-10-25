import { JavelinHidDevice } from "./javelinHidDeviceLib.js";

const connectedHTML = "<i class='fa-solid fa-repeat'></i> Change Javelin Device";
const disconnectedHTML = "<i class='fa-solid fa-plug'></i> Connect Javelin"
const notSupportedHTML = "<i class='fa-solid fa-triangle-exclamation'></i> WebHID not supported";
const notActiveHTML = "<i class='fa-solid fa-right-left'></i> Use Javelin"

// Check for WebHID support
if (!navigator.hid) {
  const connectButton = document.getElementById("connect-javelin");
  if (connectButton) {
    connectButton.disabled = true;
    connectButton.innerHTML = notSupportedHTML;
  }
}

const javelinDevice = new JavelinHidDevice();

async function connectJavelin () {
  try {
    console.log("Connecting to Javelin...");
    await javelinDevice.connect();
  } catch (error) {
    console.error("Failed to connect to Javelin device:", error);
    alert(`Failed to connect to Javelin device: ${error.message}`);
  }
}

javelinDevice.on("connected", (device) => {
  console.log("Javelin device connected:", device);
  const connectButton = document.getElementById("connect-javelin");
  if (connectButton) {
    connectButton.innerHTML = connectedHTML;
  }

  activeStenoMode = "javelin";
  window.dispatchEvent(new CustomEvent("updateActiveStenoMode"));
});

javelinDevice.on("disconnected", (device) => {
  console.log("Javelin device disconnected:", device);
  const connectButton = document.getElementById("connect-javelin");
  if (connectButton) {
    connectButton.disabled = false;
    connectButton.innerHTML = disconnectedHTML;
  }

  activeStenoMode = defaultStenoMode;
  window.dispatchEvent(new CustomEvent("updateActiveStenoMode"));
});

// Listen for paper tape events for keypresses
javelinDevice.on("paper_tape", (event) => {
  if (activeStenoMode !== "javelin") {
    return;
  }

  console.log("Paper tape event received:", event.detail);
  const { outline, translation } = event.detail;

  // Bug with firmwares earlier than xx when using non embedded protocols
  if (!outline) {
    onInput({ stenoStroke: translation, pressedKeys: stenoStrokeToPressedKeys(translation) });
    return;
  }

  onInput({ stenoStroke: outline, pressedKeys: stenoStrokeToPressedKeys(outline) });
});

// Add event listener to the connect button
const connectButton = document.getElementById("connect-javelin");
if (connectButton) {
  connectButton.addEventListener("click", () => {
    if (activeStenoMode !== "javelin"){
      activeStenoMode = "javelin";
      window.dispatchEvent(new CustomEvent("updateActiveStenoMode"));
      return;
    }

    connectJavelin();
  });
}

window.addEventListener("updateActiveStenoMode", () => {
    
window.addEventListener("updateActiveStenoMode", () => {
  if (!navigator.hid) {
    return;
  }

  if (activeStenoMode === "javelin" && javelinDevice.connected) {
    document.getElementById("connect-javelin").innerHTML = connectedHTML;
  } else {
    document.getElementById("connect-javelin").innerHTML = notActiveHTML;
  }
});
});