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

function stenoStrokeToPressedKeys(stroke) {
    const vowels = "AO*EU-";
    const startingVowels = "AO"
    const endingVowels = "EU"

    let pressedKeys = [];

    //loo pover stroke
    for (let i = 0; i < stroke.length; i++) {
        let char = stroke[i];

        if (char == "#") {
            pressedKeys.push(char);
            continue;
        }

        if (vowels.includes(char)) {
            if (startingVowels.includes(char)) {
                pressedKeys.push(char + "-");
            } else if (endingVowels.includes(char)) {
                pressedKeys.push("-" + char);
            } else if (char != "-"){
                pressedKeys.push(char);
            }

            continue;
        }

        // Check if a vowel occurs before the char at any point, if so push "-char", else push "char-"
        let isEnder = false
        for (let j = 0; j < i; j++) {
            if (vowels.includes(stroke[j])) {
                isEnder = true;
                break;
            }
        }

        if (isEnder) {
            pressedKeys.push("-" +char);
            continue;
        } else {
            pressedKeys.push(char + "-");
        }

    }

    // Replase S- with S1-
    pressedKeys = pressedKeys.map(v => v === "S-" ? "S1-" : v);

    return pressedKeys;
}

async function getDictionary() {
  const response = await fetch(
    "https://raw.githubusercontent.com/openstenoproject/plover/refs/heads/main/plover/assets/main.json"
  );
  const data = await response.json();
  return data;
}
