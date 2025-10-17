let dictionary;
let mainText;
let translation;

async function onPageLoad() {
  dictionary = await getDictionary();
  console.log(dictionary);
  mainText = document.getElementById("main-text");
  translation = document.getElementById("translation");
}
onPageLoad();

async function onInput(inputReport) {
  const { stenoStroke, pressedKeys } = inputReport;
  console.log(pressedKeys);

  mainText.textContent = stenoStroke;

  if (dictionary[stenoStroke]) {
    translation.textContent = dictionary[stenoStroke];
  } else {
    translation.textContent = "";
  }
}
