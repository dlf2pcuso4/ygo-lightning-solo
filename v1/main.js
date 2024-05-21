async function main() {
  await addScript("v1/screen.class.js");
  await addScript("v1/renderer.class.js");
  if (!document.querySelector("ygol")) {
    //full page
    document.body.insertAdjacentHTML(
      "beforeend",
      "<ygol style='width:min-content'><input id='ygol-inputYdk' type='text'><button id='ygol-loadYdk' style='margin:0 10px 10px 10px'>Load YDK</button><button id='ygol-resetField'>Reset Field</button></ygol>"
    );
    await addCss(`
    body {
      background-color: #333333;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }`);
  } else {
    //embeded div
    await addCss(`
    ygol {
      width: 1280px;
      height: 720px;
    }`);
    document
      .querySelector("ygol")
      .insertAdjacentHTML(
        "beforeend",
        "<input id='ygol-inputYdk' type='text' style='display:none'><button id='ygol-loadYdk' style='display:none'>Load YDK</button><button id='ygol-resetField' style='display:none'>Reset Field</button>"
      );
  }
  const renderer = new Renderer(1280, 720, 60, 30);
  document.querySelector("ygol").appendChild(renderer.screen.canvas);
  renderer.screen.canvas.oncontextmenu = () => false;
  document.getElementById("ygol-resetField").onclick = () =>
    renderer.resetField();
  document.getElementById("ygol-loadYdk").onclick = async () =>
    renderer.loadYdk(document.getElementById("ygol-inputYdk").value);
  await renderer.loadField();
  if (document.querySelector("ygol").getAttribute("ydk"))
    renderer.loadYdk(document.querySelector("ygol").getAttribute("ydk"));
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
    s.src = window.location.href.includes("ygo-lightning")
      ? name
      : "https://dlf2pcuso4.github.io/ygo-lightning-solo/" + name;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
main();
