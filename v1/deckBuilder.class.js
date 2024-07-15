//takes input from v1/ygolDb.class.js
class DeckBuilder {
  constructor(ygolDb, name = "Untitiled Deck", cards = []) {
    this.ygolDb = ygolDb;
    this.name = name;
    this.cards = cards; //card objects from ygolID
    this.errorimage = this.url("v1/errorimage.jpg");
  }
  url(url) {
    return window.location.href.includes("ygo-lightning")
      ? url
      : "https://dlf2pcuso4.github.io/ygo-lightning-solo/" + url;
  }
  name_url(str) {
    let fileName = str.replace(/[^a-zA-Z0-9\s_\-\.\(\)%]/g, "");
    fileName = fileName.replace(/\s/g, "_");
    return fileName.substring(0, 255);
  }
  renameDeck(name) {
    this.name = name;
  }
  appendCards(arrNames, targetDiv, width) {
    for (let el of arrNames) {
      targetDiv.insertAdjacentHTML(
        "beforeend",
        `<img src="${this.url(`cards/${this.name_url(el.name)}.jpg`)}" alt="${
          el.name
        }" style="width:${width}px;" onclick="cardClicked('${targetDiv.id}','${
          el.name
        }')" onerror="this.onerror=null; this.src='${this.errorimage}';" >`
      );
    }
  }
  appendDeck(mainDiv, extraDiv, width) {
    mainDiv.innerHTML = "";
    extraDiv.innerHTML = "";
    let main = this.cards.filter((a) => a.priority < 2000000000);
    let extra = this.cards.filter((a) => a.priority >= 2000000000);
    this.appendCards(main, mainDiv, width);
    this.appendCards(extra, extraDiv, width);
  }
  importNamelist(namelist, mainDiv, extraDiv, width) {
    for (let line of namelist.split("\n")) {
      if (
        !line.includes("#main") &&
        !line.includes("#extra") &&
        !line.includes("!side") &&
        line.length
      ) {
        //handle side deck
        this.addCard(line, mainDiv, extraDiv, width);
      }
    }
  }
  sortDeck(mainDiv, extraDiv, width) {
    this.cards.sort((a, b) => b.priority - a.priority);
    this.appendDeck(mainDiv, extraDiv, width);
  }
  searchCard(name, targetDiv, width, criteria = [], sort = "", limit = 300) {
    //criteria being an array of objects with criteria and value
    targetDiv.innerHTML = "";
    let filtered = this.ygolDb.filter((a) => {
      let n = a.name.toLowerCase();
      let d = a.description.toLowerCase();
      return n.includes(name.toLowerCase()) || d.includes(name.toLowerCase());
    });
    filtered.length = limit;
    this.appendCards(filtered, targetDiv, width);
  }
  addCard(name, mainDiv, extraDiv, width) {
    this.cards.push(this.ygolDb.filter((a) => a.name == name)[0]);
    this.appendDeck(mainDiv, extraDiv, width);
  }
  removeCard(name, mainDiv, extraDiv, width) {
    this.cards.splice(
      this.cards.indexOf(this.ygolDb.filter((a) => a.name == name)[0]),
      1
    );
    this.appendDeck(mainDiv, extraDiv, width);
  }
  exportNamelist() {
    let main = "#main\n";
    let extra = "#extra\n";
    for (let el of this.cards) {
      if (el.priority < 2000000000) {
        main += el.name + "\n";
      } else {
        extra += el.name + "\n";
      }
    }
    //needs adding side
    return main + extra + "!side\n";
  }
}
