function pressedKeysToStenoStroke(pressedKeys) {
  let pressed;
  //map keys
  pressed = pressedKeys.map((key) => {
    for (let [original, replacement] of stenoMap) {
      if (key === original) return replacement;
    }
    return null;
  });

  //steno order
  pressed = pressed.sort(
    (a, b) => stenoOrder.indexOf(a) - stenoOrder.indexOf(b)
  );

  //numbers
  if (pressed.includes("#")) {
    let number_pressed = false;
    pressed = pressed.map((key) => {
      if (numberKeys.includes(key)) {
        number_pressed = true;
        return numberKeys.indexOf(key);
      } else {
        return key;
      }
    });
    if (number_pressed) pressed.splice(pressed.indexOf("#"), 1);
  }

  let output_text = [...new Set(pressed)].join("");

  // dash handling
  const vowels_exist = /A|O|E|U/.test(output_text);
  if (vowels_exist) {
    output_text = output_text.replace(/-/g, "");
  } else {
    output_text = output_text.replace("--", "double_dash");
    output_text = output_text.replace(/(?<=.)-/g, "");
    output_text = output_text.replace("double_dash", "-");
  }

  return output_text;
}

async function getDictionary() {
  const response = await fetch(
    "https://raw.githubusercontent.com/openstenoproject/plover/refs/heads/main/plover/assets/main.json"
  );
  const data = await response.json();
  return data;
}
