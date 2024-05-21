//requires v1/screen.class.js
class Renderer {
  constructor(width, height, fps, snapTolerance, cardDb, ygolID) {
    this.screen = new Screen(width, height);
    this.fps = fps;
    this.snapTolerance = snapTolerance;
    this.mousedownPos = { x: 0, y: 0 };
    this.mouseupPos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.movingObject = "";
    this.scrollY = 0;
    this.originalObjectList;
    this.shuffling = false;
    this.ygolDeck = new YgolDeck(cardDb, ygolID);
    this.yld = "";
    this.ydk = "";
  }
  async loadField() {
    await this.screen.addObjectImg(
      "fieldbg",
      window.location.href.includes("ygo-lightning")
        ? "v1/fieldbg.png"
        : "https://dlf2pcuso4.github.io/ygo-lightning-solo/v1/fieldbg.png",
      0,
      0,
      1280,
      720,
      {
        isDraggable: false,
      }
    );
    await this.screen.addObjectImg(
      "field",
      window.location.href.includes("ygo-lightning")
        ? "v1/field.png"
        : "https://dlf2pcuso4.github.io/ygo-lightning-solo/v1/field.png",
      0,
      0,
      1280,
      720,
      {
        isDraggable: false,
      }
    );
    for (let i = 0; i < 5; i++) {
      this.screen.addObjectRect(
        `snapzone-m${i}`,
        "#00000000",
        181 + 184.5 * i,
        233,
        180,
        175,
        {
          isDraggable: false,
        }
      );
    }
    for (let i = 0; i < 5; i++) {
      this.screen.addObjectRect(
        `snapzone-st${i}`,
        "#00000000",
        181 + 184.5 * i,
        420,
        180,
        175,
        {
          isDraggable: false,
        }
      );
    }
    this.screen.addObjectRect(`snapzone-me1`, "#00000000", 363, 26, 180, 175, {
      isDraggable: false,
    });
    this.screen.addObjectRect(`snapzone-me2`, "#00000000", 737, 26, 180, 175, {
      isDraggable: false,
    });
    for (let i = 0; i < 3; i++) {
      this.screen.addObjectRect(
        `snapzone-${["pb", "pg", "pd"][i]}`,
        "#00000000",
        1104,
        139 + 187.5 * i,
        180,
        175,
        {
          isDraggable: false,
        }
      );
    }
    this.screen.addObjectRect(`snapzone-f`, "#00000000", -4, 327, 180, 175, {
      isDraggable: false,
    });
    this.screen.addObjectRect(`snapzone-pe`, "#00000000", -4, 514, 180, 175, {
      isDraggable: false,
    });
    this.screen.addObjectRect(
      `snapzone-hand`,
      "#00000000",
      200,
      600,
      880,
      120,
      {
        isDraggable: false,
      }
    );
    setInterval(() => {
      this.screen.render();
    }, 1000 / this.fps);
    this.screen.canvas.addEventListener("mousedown", (event) =>
      this.mousedown(event)
    );
    this.screen.canvas.addEventListener("mousemove", (event) =>
      this.mousemove(event)
    );
    this.screen.canvas.addEventListener("mouseup", (event) =>
      this.mouseup(event)
    );
    window.addEventListener("wheel", (event) => this.wheel(event));
    window.addEventListener("keydown", (event) => this.keydown(event));
  }
  //load deck from an array of konamiid/names
  async loadDeck(maindeck, extradeck) {
    this.deleteDeck();
    for (let i = 0; i < maindeck.length; i++) {
      await this.screen.addObjectImg(
        `main${i}`,
        "https://dlf2p.com/images/noimage.jpg",
        1134,
        514,
        120, //360
        175, //525
        {
          angle: 0,
          isDraggable: true,
          cardid: maindeck[i],
          list: null,
          isFaceup: false,
        }
      );
    }
    for (let i = 0; i < extradeck.length; i++) {
      await this.screen.addObjectImg(
        `extra${i}`,
        "https://dlf2p.com/images/noimage.jpg",
        26,
        514,
        120,
        175,
        {
          angle: 0,
          isDraggable: true,
          cardid: extradeck[i],
          list: null,
          isFaceup: false,
        }
      );
    }
    this.originalObjectList = structuredClone(this.screen.objectList);
    this.preloadImages();
  }
  loadYld(yld) {
    this.yld = yld;
    this.loadYdk(
      this.ygolDeck.namelist_to_ydk(this.ygolDeck.yld_to_namelist(yld))
    );
  }
  loadYdk(ydk) {
    this.ydk = ydk;
    let maindeck = ydk
      .split("#extra")[0]
      .split("\n")
      .filter((a) => !a.includes("#") && !a.includes("!") && a.length > 1);
    let extradeck = ydk
      .split("#extra")[1]
      .split("!side")[0]
      .split("\n")
      .filter((a) => !a.includes("#") && !a.includes("!") && a.length > 1);
    this.loadDeck(maindeck, extradeck);
  }
  loadDlf2pV2(dlf2pV2) {
    this.loadYdk(
      this.ygolDeck.namelist_to_ydk(this.ygolDeck.dlf2pV2_to_namelist(dlf2pV2))
    );
  }
  deleteDeck() {
    for (let el of this.screen.objectList) {
      if (el.id.includes("main") || el.id.includes("extra"))
        this.screen.removeObject(el.id);
    }
  }
  preloadImages() {
    for (let el of this.screen.objectList) {
      const i = document.createElement("img");
      i.src = `https://dlf2p.com/images/cards/${el.meta.cardid}.jpg`;
      document.getElementById("ygol-cnv-images").appendChild(i);
    }
  }
  shuffle(arr) {
    let array = JSON.parse(JSON.stringify(arr));
    let currentIndex = array.length;
    while (currentIndex) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }
  //list depends on mouseupPos
  openCardList() {
    this.scrollY = 0;
    this.screen.addObjectRect("list-bg", "#000000aa", 0, 0, 1280, 720, {
      isDraggable: false,
    });
    let pos = { x: 0, y: 0 };
    for (let obj of this.screen.clickedObjects(
      this.mouseupPos.x,
      this.mouseupPos.y
    )) {
      if (obj.meta.cardid) {
        const pile = this.screen
          .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
          .filter((a) => a.id.includes("snapzone-p"))[0];
        obj.meta.list = { x: pile.x, y: pile.y };
        obj.x = pos.x;
        obj.y = pos.y;
        document.getElementById(
          obj.id
        ).src = `https://dlf2p.com/images/cards/${obj.meta.cardid}.jpg`;
        this.screen.moveToFront(obj.id);
        pos.x += 120;
        if (pos.x == 1200) {
          pos.x = 0;
          pos.y += 175;
        }
      }
    }
  }
  closeCardList() {
    this.screen.removeObject("list-bg");
    for (let obj of this.screen.objectList) {
      if (obj.meta.list) {
        obj.x = obj.meta.list.x + 30;
        obj.y = obj.meta.list.y;
        obj.meta.list = null;
        document.getElementById(obj.id).src = obj.meta.isFaceup
          ? `https://dlf2p.com/images/cards/${obj.meta.cardid}.jpg`
          : "https://dlf2p.com/images/noimage.jpg";
      }
    }
  }
  flipCard(el) {
    if (el.meta.cardid) {
      document.getElementById(el.id).src =
        document.getElementById(el.id).src ==
        "https://dlf2p.com/images/noimage.jpg"
          ? `https://dlf2p.com/images/cards/${el.meta.cardid}.jpg`
          : "https://dlf2p.com/images/noimage.jpg";
      el.meta.isFaceup = el.meta.isFaceup ? false : true;
    }
  }
  spreadHand() {
    let handcount = this.screen.objectList.filter((a) => a.y == 545).length;
    let x = 640 - 60 * handcount;
    let hand = this.screen.objectList
      .filter((a) => a.y == 545)
      .sort((a, b) => a.x - b.x);
    let nonhand = this.screen.objectList.filter((a) => a.y != 545);
    for (let el of hand) {
      el.x = x;
      x += 120;
    }
    this.screen.objectList = nonhand.concat(hand);
  }
  async shuffleDeck() {
    if (!this.shuffling) {
      this.shuffling = true;
      let isDeckOpen = this.screen.objectList.filter(
        (a) => a.x == 1134 && a.y == 514
      ).length
        ? false
        : true;
      if (isDeckOpen) this.closeCardList();
      let deckCards = this.screen.objectList.filter(
        (a) => a.x == 1134 && a.y == 514
      );
      let nonDeckCards = this.screen.objectList.filter(
        (a) => a.x != 1134 || a.y != 514
      );
      deckCards = this.shuffle(deckCards);
      this.screen.objectList = nonDeckCards.concat(deckCards);
      this.mouseupPos = { x: 1164, y: 554 };
      if (isDeckOpen) {
        this.openCardList();
        this.shuffling = false;
      } else {
        for (let i = 0; i < 5; i++) {
          await this.screen.addObjectImg(
            `shuffle${i}`,
            "https://dlf2p.com/images/noimage.jpg",
            1134,
            464 + 30 * i,
            120,
            175,
            {
              isDraggable: false,
            }
          );
        }
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            this.screen.removeObject(`shuffle${i}`);
          }
          this.shuffling = false;
        }, 100);
      }
    }
  }
  resetField() {
    for (let el of this.screen.objectList) {
      if (el.meta.cardid)
        document.getElementById(
          el.id
        ).src = `https://dlf2p.com/images/noimage.jpg`;
    }
    this.screen.objectList = structuredClone(this.originalObjectList);
  }
  mousedown(event) {
    this.isMouseDown = true;
    const rect = this.screen.canvas.getBoundingClientRect();
    this.mousedownPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    this.movingObject = this.screen
      .clickedObjects(this.mousedownPos.x, this.mousedownPos.y)
      .at(-1).id;
  }
  mousemove(event) {
    if (this.isMouseDown) {
      //drag card
      const rect = this.screen.canvas.getBoundingClientRect();
      if (
        this.mousedownPos.x != event.clientX - rect.left ||
        this.mousedownPos.y != event.clientY - rect.top
      )
        for (let obj of this.screen.objectList) {
          if (obj.id == this.movingObject && obj.meta.isDraggable) {
            obj.x = event.clientX - rect.left - obj.width / 2;
            obj.y = event.clientY - rect.top - obj.height / 2;
            this.screen.moveToFront(this.movingObject);
            if (obj.meta.list) {
              obj.meta.list = null;
              obj.meta.isFaceup = true;
            }
            this.closeCardList();
          }
        }
    }
  }
  mouseup(event) {
    this.isMouseDown = false;
    const rect = this.screen.canvas.getBoundingClientRect();
    this.mouseupPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    if (
      this.mousedownPos.x != this.mouseupPos.x ||
      this.mousedownPos.y != this.mouseupPos.y
    ) {
      //snap card to zone
      for (let clicked of this.screen.clickedObjects(
        this.mouseupPos.x,
        this.mouseupPos.y
      )) {
        if (clicked.id.includes("snapzone")) {
          for (let obj of this.screen.objectList) {
            if (obj.id == this.movingObject && obj.meta.isDraggable) {
              if (clicked.id == "snapzone-hand") {
                obj.y = 545;
              } else {
                obj.x = clicked.x + 30;
                obj.y = clicked.y;
              }
              if (!clicked.id.includes("snapzone-m")) obj.meta.angle = 0;
            }
          }
        }
      }
    }
    this.spreadHand();
    if (
      Math.abs(this.mousedownPos.x - this.mouseupPos.x) < this.snapTolerance &&
      Math.abs(this.mousedownPos.y - this.mouseupPos.y) < this.snapTolerance
    ) {
      if (event.which == 1) {
        if (
          this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .filter((a) => a.id == "list-bg").length
        ) {
          this.closeCardList();
        }
        if (
          this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .filter((a) => a.id.includes("snapzone-m")).length
        ) {
          //rotate card
          let el = this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .at(-1);
          if (el.meta.cardid) el.meta.angle = el.meta.angle == 270 ? 0 : 270;
        }
        if (
          this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .filter((a) => a.id.includes("snapzone-p")).length &&
          this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .filter((a) => a.meta.cardid).length
        ) {
          this.openCardList();
        }
      }
      //flip card
      if (event.which == 3) {
        if (
          this.screen
            .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
            .filter((a) => a.id == "snapzone-pd").length
        ) {
          this.shuffleDeck();
        } else {
          this.flipCard(
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .at(-1)
          );
        }
      }
    }
  }
  wheel(event) {
    this.scrollY += event.deltaY;
    if (this.scrollY < 0) {
      this.scrollY -= event.deltaY;
    } else {
      for (let obj of this.screen.objectList) {
        if (obj.meta.list) {
          obj.y -= event.deltaY;
        }
      }
    }
  }
  keydown(event) {
    if (!this.isMouseDown) {
      if (event.key == "r") {
        this.resetField();
      }
      if (event.key == "s") {
        this.shuffleDeck();
      }
    }
  }
}
