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
    const keyId = group.id;
    if (!keyId) return;
    mapping[keyId] = mapping[keyId] || {};
    mapping[keyId].unpressed = group;
  });

  return mapping;
}

/**
 * Update key visibility based on which keys are pressed.
 * @param {string[]} pressedKeys - e.g. ["ls", "rf", "rp"]
 * @param {Object} keyMap - result of parseSVG()
 */
function updateKeys(pressedKeys, keyMap) {
  Object.entries(keyMap).forEach(([keyId, { pressed, unpressed }]) => {
    const isPressed = pressedKeys.includes(keyId);
    if (pressed) pressed.style.display = isPressed ? "block" : "none";
    if (unpressed) unpressed.style.display = isPressed ? "none" : "block";
  });
}

async function loadSVG() {
  const response = await fetch("/assets/asterisk_layout.svg");
  const svgText = await response.text();
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  const svgElement = svgDoc.documentElement;
  document.getElementById("chart-container").appendChild(svgElement);

  //parse steno chart
  keyMap = parseSVG(svgElement);
  console.log(keyMap);
}
