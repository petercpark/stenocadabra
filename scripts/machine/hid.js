const connectedHTML = "HID connected";
const disconnectedHTML = "<i class='fa-solid fa-plug'></i> Connect HID";
const notActiveHTML = "<i class='fa-solid fa-right-left'></i> Use HID"


let device;
let deviceConnected = false;

document.getElementById("connect-hid").addEventListener("click", connectDevice);

async function connectDevice() {
  if (deviceConnected && activeStenoMode !== "hid") {
    activeStenoMode = "hid";
    window.dispatchEvent(new CustomEvent("updateActiveStenoMode"));
    return;
  }

  try {
    const filters = [
      {
        usagePage: 0xff50,
        usage: 0x4c56,
      },
    ];
    device = await navigator.hid.requestDevice({ filters });
    if (device.length > 0) {
      device = device[0];
    } else {
      return;
    }
    await device.open();
    device.addEventListener("inputreport", deviceInputHandler);
    onDeviceConnect();
  } catch (err) {
    console.error(err);
    alert("Failed to connect: " + err.message);
  }
}

async function deviceInputHandler(event) {
  const { data, reportId } = event;

  if (reportId !== 0x50) return; // only handle report ID 0x50
  if (activeStenoMode !== "hid") return;

  const bytes = new Uint8Array(data.buffer);

  // binary
  let binaryStr = "";
  for (let b of bytes) {
    binaryStr += b.toString(2).padStart(8, "0") + " ";
  }

  // hex
  let hexStr = "";
  for (let b of bytes) {
    hexStr += b.toString(16).padStart(2, "0") + " ";
  }

  // keys
  let pressedKeys = [];
  for (let i = 0; i < 64; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;
    if (bytes[byteIndex] & (0x80 >> bitIndex)) {
      if (keyNames[i]) pressedKeys.push(keyNames[i]);
    }
  }

  //steno stroke
  const stenoStroke = pressedKeysToStenoStroke(pressedKeys);

  onInput({ stenoStroke, pressedKeys, hexStr, binaryStr });
}

function onDeviceConnect() {
  deviceConnected = true;
  activeStenoMode = "hid"
  window.dispatchEvent(new CustomEvent("updateActiveStenoMode"));
  document.getElementById("connect-hid").innerHTML = connectedHTML;
}

function onDeviceDisconnect() {
  deviceConnected = false;
  document.getElementById("connect-hid").innerHTML = disconnectedHTML;
}

window.addEventListener("updateActiveStenoMode", () => {
  if (activeStenoMode === "hid" && deviceConnected) {
    document.getElementById("connect-hid").disabled = true;
    document.getElementById("connect-hid").innerHTML = connectedHTML;
  } else if (activeStenoMode !== "hid" && deviceConnected) {
    document.getElementById("connect-hid").disabled = false;
    document.getElementById("connect-hid").innerHTML = notActiveHTML;
  }
});