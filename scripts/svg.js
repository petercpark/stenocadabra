/**
 * Parse an SVG layout and collect key references for pressed and unpressed states.
 * @param {SVGElement} svg - The root SVG element.
 * @returns {Object} mapping of keyId -> { pressed: Element, unpressed: Element }
 */
function parseSVG(svg) {
  const pressedGroup = svg.querySelector("#pressed");
  const notPressedGroup = svg.querySelector("#not_pressed");

  if (!pressedGroup || !notPressedGroup) {
    console.error("Missing #pressed or #not_pressed groups in SVG");
    return {};
  }

  const pressedKeysGroups = pressedGroup.querySelectorAll(":scope > g");
  const notPressedKeysGroups = notPressedGroup.querySelectorAll(":scope > g");

  const mapping = {};

  pressedKeysGroups.forEach((group) => {
    const keyId = group.id;
    if (!keyId) return;
    mapping[keyId] = mapping[keyId] || {};
    mapping[keyId].pressed = group;
  });

  notPressedKeysGroups.forEach((group) => {
    const keyId = group.id.replace("_2", "");
    if (!keyId) return;
    mapping[keyId] = mapping[keyId] || {};
    mapping[keyId].unpressed = group;
  });

  return mapping;
}

/**
 * Update key visibility based on which keys are pressed.
 * @param {string[]} pressedKeys - e.g. ["S-", "T-", "P-"]
 * @param {Object} keymap - result of parseSVG()
 */
function updateKeys(pressedKeys, keymap) {
  Object.entries(keymap).forEach(([keyId, { pressed, unpressed }]) => {
    let isPressed =
      pressedKeys.includes(keyId) ||
      pressedKeys.includes(keyId.replace(/\d/g, ""));

    if (pressed) pressed.style.display = isPressed ? "block" : "none";
    if (unpressed) unpressed.style.display = isPressed ? "none" : "block";
  });
}

// click listeners
function initialize_svg_listeners() {
  Object.entries(keymap).forEach(([keyId, { pressed, unpressed }]) => {
    //unpressed keys
    unpressed.style.pointerEvents = "bounding-box";
    //click
    unpressed.addEventListener("mousedown", () => {
      press_svg_key(keyId, { pressed, unpressed });
    });

    //pressed keys
    //click
    pressed.addEventListener("mousedown", () => {
      unpress_svg_key(keyId, { pressed, unpressed });
    });
  });
}

function press_svg_key(keyId, { pressed, unpressed }) {
  if (!global_pressed_keys.includes(keyId)) {
    unpressed.style.pointerEvents = "auto";
    global_pressed_keys.push(keyId);
    const stenoStroke = pressedKeysToStenoStroke(global_pressed_keys);
    onInput({ stenoStroke, pressedKeys: global_pressed_keys });
  }
}
function unpress_svg_key(keyId, { pressed, unpressed }) {
  unpressed.style.pointerEvents = "bounding-box";
  global_pressed_keys = global_pressed_keys.filter((k) => k !== keyId);
  const stenoStroke = pressedKeysToStenoStroke(global_pressed_keys);
  onInput({ stenoStroke, pressedKeys: global_pressed_keys });
}

async function loadSVG() {
  const response = await fetch("assets/asterisk_layout.svg");
  const svgText = await response.text();
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  const svgElement = svgDoc.documentElement;
  document.getElementById("chart-container").appendChild(svgElement);

  //parse steno chart
  keymap = parseSVG(svgElement);
  updateKeys([], keymap);

  initialize_svg_listeners();

  console.log(keymap);
}
