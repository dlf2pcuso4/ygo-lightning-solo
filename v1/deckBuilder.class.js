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
        altSrc = `https://images.ygoprodeck.com/images/cards/${Number(
          el.konamiID
        )}.jpg`;
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
  searchCard(name, targetDiv, width, criterias = [], sort = "", limit = 300) {
    targetDiv.innerHTML = "";
    let filtered = this.ygolDb.filter((a) => {
      let n = a.name.toLowerCase();
      let d = a.description.toLowerCase();
      return n.includes(name.toLowerCase()) || d.includes(name.toLowerCase());
    });
    //apply filters
    for (let term of criterias) {
      if (term.includes("Monster")) {
        filtered = filtered.filter((a) => a.type == "Monster");
        if (term != "Monster") {
          let monsterType = term.replace(" Monster", "");
          if (monsterType == "Main Deck") {
            filtered = filtered.filter(
              (a) =>
                !(
                  a.monsterType.includes("Fusion") ||
                  a.monsterType.includes("Synchro") ||
                  a.monsterType.includes("Xyz") ||
                  a.monsterType.includes("Link")
                )
            );
          } else if (monsterType == "Extra Deck") {
            filtered = filtered.filter(
              (a) =>
                a.monsterType.includes("Fusion") ||
                a.monsterType.includes("Synchro") ||
                a.monsterType.includes("Xyz") ||
                a.monsterType.includes("Link")
            );
          } else if (monsterType == "Non-Effect") {
            filtered = filtered.filter(
              (a) => !a.monsterType.includes("Effect")
            );
          } else {
            filtered = filtered.filter((a) =>
              a.monsterType.includes(monsterType)
            );
          }
        }
      } else if (term.includes("Spell")) {
        filtered = filtered.filter((a) => a.type == "Spell");
        if (term != "Spell") {
          let spellType = term.replace(" Spell", "");
          filtered = filtered.filter((a) => a.race.includes(spellType));
        }
      } else if (term.includes("Trap")) {
        filtered = filtered.filter((a) => a.type == "Trap");
        if (term != "Trap") {
          let trapType = term.replace(" Trap", "");
          filtered = filtered.filter((a) => a.race.includes(trapType));
        }
      } else if (term.includes("Level/Rank")) {
        let levelrank = term.replace("Level/Rank ", "");
        filtered = filtered.filter((a) => a.level == levelrank);
      } else if (term.includes("Link")) {
        let link = term.replace("Link ", "");
        filtered = filtered.filter((a) => a.linkRating == link);
      } else if (term.toUpperCase() == term) {
        filtered = filtered.filter((a) => a.attribute == term);
      } else if (term.includes("(DL)")) {
        //DL
      } else if (term.includes("(MD)")) {
        //MD
      } else if (term == "Handtrap") {
        filtered = filtered.filter((a) => a.handtrap);
      } else if (term == "Floodgate") {
        filtered = filtered.filter((a) => a.floodgate);
      } else {
        filtered = filtered.filter((a) => a.race == term);
      }
    }
    filtered.length = limit;
    if (sort == "Popularity") {
      filtered.sort((a, b) => a.popRank - b.popRank);
    } else if (sort == "Rarity") {
      //rarity
    } else {
      //name
    }
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
let editorFilters = `
<p class="filterheader">Sort By</p>
<button class="minibtn" onmousedown="selectSort(this.innerHTML)">
  Popularity
</button>
<button class="minibtn" onmousedown="selectSort(this.innerHTML)">
  Name
</button>
<button class="minibtn" onmousedown="selectSort(this.innerHTML)">
  Rarity
</button>
<p class="filterheader">Card Type</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Trap
</button>
<p class="filterheader">Monster Type</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Normal Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Effect Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Fusion Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Ritual Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Synchro Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Xyz Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Pendulum Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Main Deck Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Extra Deck Monster
</button>
<br />
<br />
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Tuner Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Union Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Spirit Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Flip Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Gemini Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Toon Monster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Non-Effect Monster
</button>
<p class="filterheader">Spell Type</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Normal Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Continuous Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Equip Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Field Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Ritual Spell
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Quick-Play Spell
</button>
<p class="filterheader">Trap Type</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Normal Trap
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Continuous Trap
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Counter Trap
</button>
<p class="filterheader">Level/Rank</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 1
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 2
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 3
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 4
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 5
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 6
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 7
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 8
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 9
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 10
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 11
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 12
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Level/Rank 13
</button>
<p class="filterheader">Link Rating</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 1
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 2
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 3
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 4
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 5
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Link 6
</button>
<p class="filterheader">Attribute</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  LIGHT
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  DARK
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  EARTH
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  WIND
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  WATER
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  FIRE
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  DIVINE
</button>
<p class="filterheader">Type</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Aqua
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Beast
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Beast-Warrior
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Creator-God
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Cyberse
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Dinosaur
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Divine-Beast
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Dragon
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Fairy
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Fiend
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Fish
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Insect
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Machine
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Plant
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Psychic
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Pyro
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Reptile
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Rock
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Sea Serpent
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Spellcaster
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Thunder
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Warrior
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Winged Beast
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Wyrm
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Zombie
</button>
<p class="filterheader">Staples</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Handtrap
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Floodgate
</button>
<p class="filterheader">Duel Links</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  UR (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  SR (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  R (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  N (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Free (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Rush (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Released (DL)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Not Released (DL)
</button>
<p class="filterheader">Master Duel</p>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  UR (MD)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  SR (MD)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  R (MD)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  N (MD)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Released (MD)
</button>
<button class="minibtn" onmousedown="selectFilter(this.innerHTML)">
  Not Released (MD)
</button>
<br />
<div style="position: sticky; text-align: end; bottom: 10px; right: 10px;">
  <button onmousedown="clearFilters()">
    Clear Filters
  </button>
</div>
`;
