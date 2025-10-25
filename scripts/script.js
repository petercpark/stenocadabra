let dictionary;
let mainText;
let translation;

let defaultStenoMode = "hid";
let activeStenoMode = defaultStenoMode; // The active steno mode. Options are "hid", "javelin" or undefined

async function onPageLoad() {
  //get elements
  mainText = document.getElementById("main-text");
  translation = document.getElementById("translation");

  //load assets
  dictionary = await getDictionary();
  await loadSVG();
}
onPageLoad();

async function onInput(inputReport) {
  const { stenoStroke, pressedKeys } = inputReport;
  console.log(pressedKeys);

  //steno stroke
  mainText.textContent = stenoStroke;

  // chart
  updateKeys(pressedKeys, keyMap);

  //translation
  if (dictionary[stenoStroke]) {
    translation.textContent = dictionary[stenoStroke];
  } else {
    translation.textContent = "";
  }
}
