//takes input from v1/ygolDb.class.js
class DeckBuilder {
  constructor(ygolDb, name = "Untitiled Deck", cards = [], side = []) {
    this.ygolDb = ygolDb;
    this.name = name;
    this.cards = cards; //card objects from ygolID
    this.side = side;
    this.format = "tcg";
    this.banlists = [];
    this.editingDeck = "main";
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
  changeFormat(format) {
    this.format = format;
  }
  addBanlist(format, arrBanlist) {
    this.banlists.push({ format: format, banlist: arrBanlist });
  }
  switchEditingDeck(mainDiv, extraDiv, width) {
    if (this.editingDeck == "main") {
      this.editingDeck = "side";
      this.appendSide(mainDiv, extraDiv, width);
      return `View Main Deck`;
    } else {
      this.editingDeck = "main";
      this.appendDeck(mainDiv, extraDiv, width);
      return `View Side Deck`;
    }
  }
  appendCards(arrNames, targetDiv, width) {
    for (let el of arrNames) {
      let altSrc = this.errorimage;
      if (el.konamiID)
        altSrc = `https://images.ygoprodeck.com/images/cards/${el.konamiID}.jpg`;
      targetDiv.insertAdjacentHTML(
        "beforeend",
        `<img src="${this.url(`cards/${this.name_url(el.name)}.jpg`)}" alt="${
          el.name
        }" style="width:${width}px;" onmousedown="cardClicked(\`${
          targetDiv.id
        }\`,\`${
          el.name
        }\`)" onerror="if(this.src==\`${altSrc}\`){this.onerror=null; this.src=\`${
          this.errorimage
        }\`;}else{this.src=\`${altSrc}\`}" >`
      );
      let banlistCard = this.banlists
        .filter((a) => a.format == this.format)[0]
        .banlist.filter((a) => a.name == el.name)[0];
      if (banlistCard) {
        targetDiv.insertAdjacentHTML(
          "beforeend",
          `<img src="v1/${banlistCard.banStatus}.png" style="width:${
            width / 3
          }px;margin:-${(width * 35) / 24}px ${(width * 2) / 3}px ${
            (width * 9) / 8
          }px -${width}px ;">`
        );
      }
    }
  }
  appendDeck(mainDiv, extraDiv, width) {
    mainDiv.innerHTML = "";
    extraDiv.innerHTML = "";
    let main = this.cards.filter((a) => a.priorityDl < 2000000000);
    let extra = this.cards.filter((a) => a.priorityDl >= 2000000000);
    this.appendCards(main, mainDiv, width);
    this.appendCards(extra, extraDiv, width);
  }
  appendSide(mainDiv, extraDiv, width) {
    mainDiv.innerHTML = "";
    extraDiv.innerHTML = "";
    this.appendCards(this.side, mainDiv, width);
  }
  importNamelist(namelist, mainDiv, extraDiv, width) {
    for (let line of namelist.split("\n")) {
      if (line.includes("!side"))
        this.switchEditingDeck(mainDiv, extraDiv, width);
      if (
        !line.includes("#main") &&
        !line.includes("#extra") &&
        !line.includes("!side") &&
        line.length
      ) {
        this.addCard(line, mainDiv, extraDiv, width);
      }
    }
    if (this.editingDeck == "side")
      this.switchEditingDeck(mainDiv, extraDiv, width);
  }
  sortDeck(mainDiv, extraDiv, width, format = "dl") {
    if (this.editingDeck == "main") {
      this.cards.sort((a, b) =>
        format == "dl"
          ? b.priorityDl - a.priorityDl
          : b.priorityMd - a.priorityMd
      );
      this.appendDeck(mainDiv, extraDiv, width);
    } else {
      this.side.sort((a, b) =>
        format == "dl"
          ? b.priorityDl - a.priorityDl
          : b.priorityMd - a.priorityMd
      );
      this.appendSide(mainDiv, extraDiv, width);
    }
  }
  displayCard(name, targetDiv, width) {
    let cardObj = this.ygolDb.filter((a) => a.name == name)[0];
    let altSrc = this.errorimage;
    if (cardObj.konamiID)
      altSrc = `https://images.ygoprodeck.com/images/cards/${cardObj.konamiID}.jpg`;
    targetDiv.innerHTML = "";
    targetDiv.insertAdjacentHTML(
      "beforeend",
      `<div style="display: flex; justify-content: center">
        <img src="${this.url(
          `cards/${this.name_url(name)}.jpg`
        )}" alt="${name}" style="width:${width}px;" onerror="if(this.src==\`${altSrc}\`){this.onerror=null; this.src=\`${
        this.errorimage
      }\`;}else{this.src=\`${altSrc}\`}" >
      </div>
      <p class="cardname">${cardObj.name}</p>
      <p>${cardObj.description}</p>`
    );
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
    if (
      this.cards.filter((a) => a.name == name).length +
        this.side.filter((a) => a.name == name).length <
      3
    ) {
      if (this.editingDeck == "main") {
        this.cards.push(this.ygolDb.filter((a) => a.name == name)[0]);
        this.appendDeck(mainDiv, extraDiv, width);
      } else {
        this.side.push(this.ygolDb.filter((a) => a.name == name)[0]);
        this.appendSide(mainDiv, extraDiv, width);
      }
    }
  }
  removeCard(name, mainDiv, extraDiv, width) {
    if (this.editingDeck == "main") {
      this.cards.splice(
        this.cards.indexOf(this.ygolDb.filter((a) => a.name == name)[0]),
        1
      );
      this.appendDeck(mainDiv, extraDiv, width);
    } else {
      this.side.splice(
        this.side.indexOf(this.ygolDb.filter((a) => a.name == name)[0]),
        1
      );
      this.appendSide(mainDiv, extraDiv, width);
    }
  }
  exportNamelist() {
    let main = "#main\n";
    let extra = "#extra\n";
    let side = "!side\n";
    for (let el of this.cards) {
      if (el.priorityDl < 2000000000) {
        main += el.name + "\n";
      } else {
        extra += el.name + "\n";
      }
    }
    for (let el of this.side) {
      side += el.name + "\n";
    }
    return main + extra + side;
  }
}
