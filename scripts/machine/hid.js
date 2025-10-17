let device;
let deviceConnected = false;

document.getElementById("connect").addEventListener("click", connectDevice);

async function connectDevice() {
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
  document.getElementById("connect").style.display = "none";
}
