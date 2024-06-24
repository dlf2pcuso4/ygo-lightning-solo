//requires v1/ygolDeck.class.js
class DeckBuilder {
  constructor(cardDb, ygolID, decks = []) {
    this.cardDb = cardDb;
    this.ygolID = ygolID;
    this.decks = decks; //[{ name: "", yld: "", rush: false }];
    this.currentDeck = {};
  }
  chooseDeck(name) {
    this.currentDeck = this.decks.filter((a) => a.name == name)[0];
  }
  createDeck(name, isRush) {
    this.currentDeck = { name: name, yld: "", rush: isRush };
    this.decks.push(this.currentDeck);
  }
  deleteDeck(name) {
    this.decks = this.decks.filter((a) => a.name != name);
    this.currentDeck = this.decks.at(-1);
  }
  saveDeck() {
    this.deleteDeck(this.currentDeck.name);
    this.decks.push(this.currentDeck);
  }
  changeName(name) {
    for (let el of this.decks) {
      if (el.name == this.currentDeck.name) {
        el.name = name;
        break;
      }
    }
    this.currentDeck.name = name;
  }
  addCard(name) {
    let ygolDeck = new YgolDeck(
      this.cardDb,
      this.ygolID,
      this.currentDeck.rush
    );
    let namelist = ygolDeck.convert(this.currentDeck.yld, "namelist");
    if (ygolDeck.isEDMonster(name)) {
      namelist += name;
    } else {
      namelist.replace("#extra", `${name}\n#extra`);
    }
    this.currentDeck.yld = ygolDeck.convert(this.sortNamelist(namelist), "yld");
  }
  removeCard(name) {
    let ygolDeck = new YgolDeck(
      this.cardDb,
      this.ygolID,
      this.currentDeck.rush
    );
    let namelist = ygolDeck.convert(this.currentDeck.yld, "namelist");
    namelist = namelist.replace(name + "\n", "");
    this.currentDeck.yld = ygolDeck.convert(this.sortNamelist(namelist), "yld");
  }
  sortNamelist(namelist) {
    return namelist;
  }
}
