let allowAutoLoadDeck = false;
async function main() {
  if (!document.getElementById("ygol-mainDiv")) {
    //full page
    document.body.insertAdjacentHTML(
      "beforeend",
      "<div id='ygol-mainDiv' style='width:min-content'><input id='ygol-inputYdk' type='text'><button id='ygol-loadYdk' style='margin:0 10px 10px 10px'>Load YDK</button><button id='ygol-resetField'>Reset Field</button></div>"
    );
    await addCss(`
    body {
      background-color: #333333;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }`);
    await addScript("v1/renderer.js");
  } else {
    //embeded div
    await addCss(`
    .ygol-mainDiv {
      width: 1280px;
      height: 720px;
    }`);
    document.body.insertAdjacentHTML(
      "beforeend",
      "<input id='ygol-inputYdk' type='text' style='display:none'><button id='ygol-loadYdk' style='display:none'>Load YDK</button><button id='ygol-resetField' style='display:none'>Reset Field</button>"
    );
    await addScript("v1/renderer.js");
    allowAutoLoadDeck = true;
  }
}
function autoLoadDeck(ydk) {
  if (allowAutoLoadDeck) {
    document.getElementById("ygol-inputYdk").value = ydk;
    document.getElementById("ygol-loadYdk").click();
  }
}
function addCss(txt) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("style");
    s.innerHTML = txt;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function addScript(name) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = name;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
main();
