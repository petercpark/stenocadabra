let qwertyKeysPressed = [];

const qwertyMap = {
  1: "#",
  2: "#",
  3: "#",
  4: "#",
  5: "#",
  6: "#",
  7: "#",
  8: "#",
  9: "#",
  0: "#",
  q: "S1-",
  a: "S2-",
  w: "T-",
  s: "K-",
  e: "P-",
  d: "W-",
  r: "H-",
  f: "R-",
  c: "A-",
  v: "O-",
  t: "*",
  g: "*",
  y: "*",
  h: "*",
  n: "-E",
  m: "-U",
  u: "-F",
  j: "-R",
  i: "-P",
  k: "-B",
  o: "-L",
  l: "-G",
  p: "-T",
  ";": "-S",
  "[": "-D",
  "'": "-Z",
};

window.addEventListener("keydown", keyDownHandler);
window.addEventListener("keyup", keyUpHandler);

function keyDownHandler(event) {
  const key = event.key.toLowerCase();
  //add key to pressed keys
  if (!qwertyKeysPressed.includes(key)) qwertyKeysPressed.push(key);

  //handle qwerty keys
  qwertyInputHandler();
}

function keyUpHandler(event) {
  const key = event.key.toLowerCase();
  //remove key from pressed keys
  if (qwertyKeysPressed.includes(key)) {
    qwertyKeysPressed = qwertyKeysPressed.filter((k) => k !== key);
  }

  //handle qwerty keys
  qwertyInputHandler();
}

function qwertyInputHandler() {
  let pressedKeys = [];
  for (let key of qwertyKeysPressed) {
    if (qwertyMap[key]) pressedKeys.push(qwertyMap[key]);
  }

  //steno stroke
  const stenoStroke = pressedKeysToStenoStroke(pressedKeys);

  onInput({ stenoStroke, pressedKeys });
}
