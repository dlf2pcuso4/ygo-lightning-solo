async function main() {
  await addScript("v1/cardDb.js");
  await addScript("v1/ygolID.js");
  await addScript("v1/ygolDeck.class.js");
  await addScript("v1/screen.class.js");
  await addScript("v1/renderer.class.js");
  if (!document.querySelector("ygol")) {
    //full page
    document.body.insertAdjacentHTML(
      "beforeend",
      "<ygol style='width:min-content'></ygol>"
    );
    await addCss(`
    body {
      background-color: #000000;
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
  }
  let isRush = document.querySelector("ygol").getAttribute("rush");
  const renderer = new Renderer(1280, 720, 60, 30, 0.5, cardDb, ygolID, isRush);
  document.querySelector("ygol").appendChild(renderer.screen.canvas);
  renderer.screen.canvas.oncontextmenu = () => false;
  await renderer.loadField();
  if (document.querySelector("ygol").getAttribute("yld")) {
    renderer.loadYld(document.querySelector("ygol").getAttribute("yld"));
  } else if (document.querySelector("ygol").getAttribute("ydk")) {
    renderer.loadYdk(document.querySelector("ygol").getAttribute("ydk"));
  } else if (document.querySelector("ygol").getAttribute("dlf2pV2")) {
    renderer.loadDlf2pV2(
      document.querySelector("ygol").getAttribute("dlf2pV2")
    );
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
    s.src = window.location.href.includes("ygo-lightning")
      ? name
      : "https://dlf2pcuso4.github.io/ygo-lightning-solo/" + name;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
main();
