//requires v1/screen.class.js
//requires v1/ygolDeck.class.js
class Renderer {
  constructor(
    width,
    height,
    fps,
    snapTolerance,
    mouseHoldDelay,
    cardDb,
    ygolID,
    isRush
  ) {
    this.screen = new Screen(width, height);
    this.fps = fps;
    this.snapTolerance = snapTolerance;
    this.mouseHoldDelay = mouseHoldDelay;
    this.mousedownPos = { x: 0, y: 0 };
    this.mouseupPos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.clicksWithinDelay = 0;
    this.mouseHoldingDown = "false";
    this.movingObject = "";
    this.movingObjectOgPos = null;
    this.scrollY = 0;
    this.originalObjectList;
    this.shuffling = false;
    this.changingLifePoints = false;
    this.ygolDeck = new YgolDeck(cardDb, ygolID, isRush);
    this.yld = "";
    this.ydk = "";
    this.noimage = this.url("v1/noimage.jpg");
    this.errorimage = this.url("v1/errorimage.jpg");
    //debug
    this.showHitboxes = false;
    this.hitboxColor = this.showHitboxes ? "#ff000088" : "#00000000";
    this.allowIllegalPlacement = false;
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
  async loadField() {
    await this.screen.addObjectImg(
      "fieldbg",
      this.url("v1/fieldbg.png"),
      0,
      0,
      1280,
      720
    );
    await this.screen.addObjectImg(
      "field",
      this.url("v1/field.png"),
      0,
      0,
      1280,
      720
    );
    await this.screen.addObjectImg(
      "menu-toggle",
      this.url("v1/menu.png"),
      10,
      10,
      80,
      80
    );
    for (let i = 0; i < 5; i++) {
      this.screen.addObjectRect(
        `snapzone-m${i}`,
        this.hitboxColor,
        181 + 184.5 * i,
        233,
        180,
        175
      );
    }
    for (let i = 0; i < 5; i++) {
      this.screen.addObjectRect(
        `snapzone-st${i}`,
        this.hitboxColor,
        181 + 184.5 * i,
        420,
        180,
        175
      );
    }
    this.screen.addObjectRect(
      `snapzone-me1`,
      this.hitboxColor,
      363,
      26,
      180,
      175
    );
    this.screen.addObjectRect(
      `snapzone-me2`,
      this.hitboxColor,
      737,
      26,
      180,
      175
    );
    for (let i = 0; i < 3; i++) {
      this.screen.addObjectRect(
        `snapzone-${["pb", "pg", "pd"][i]}`,
        this.hitboxColor,
        1104,
        139 + 187.5 * i,
        180,
        175
      );
    }
    this.screen.addObjectRect(
      `snapzone-f`,
      this.hitboxColor,
      -4,
      327,
      180,
      175
    );
    this.screen.addObjectRect(
      `snapzone-pe`,
      this.hitboxColor,
      -4,
      514,
      180,
      175
    );
    this.screen.addObjectRect(
      `snapzone-hand`,
      this.hitboxColor,
      200,
      600,
      880,
      120
    );
    this.screen.addObjectRect(`lp-box`, "#00000066", 10, 90, 240, 70);
    this.screen.addObjectText("lp-txt", "#ffffff", 20, 100, 800, {
      text: "LP:",
      fontSize: "40pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("lp-num", "#ffffff", 100, 100, 800, {
      text: "8000",
      fontSize: "40pt",
      fontFamily: "Bahnschrift light",
    });
    await this.screen.addObjectImg(
      "dice",
      this.url("v1/1.png"),
      1180,
      30,
      60,
      60
    );
    setInterval(async () => {
      //show card info when holding down mouse
      if (this.mouseHoldingDown == "true") {
        if (
          !this.screen.objectList.filter((a) => a.id == "popup-card").length
        ) {
          this.screen.addObjectRect("popup-bg", "#000000cc", 0, 0, 1280, 720);
          let cardname = this.screen
            .clickedObjects(this.mousedownPos.x, this.mousedownPos.y)
            .filter((a) => a.meta.cardname)
            .at(-1).meta.cardname;
          let card = this.ygolDeck.db.filter((a) => a.name == cardname)[0];
          await this.screen.addObjectImg(
            "popup-card",
            this.url(`cards/${this.name_url(cardname)}.jpg`),
            0,
            0,
            360,
            525
          );
          this.screen.addObjectText("popup-txt", "#ffffff", 400, 30, 800, {
            text: card.description,
            fontSize: "20pt",
            fontFamily: "Bahnschrift light",
          });
        }
      } else {
        this.screen.removeObject("popup-bg");
        this.screen.removeObject("popup-card");
        this.screen.removeObject("popup-txt");
      }
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
    if (document.querySelector("ygol").getAttribute("matsrc"))
      this.changeMat(document.querySelector("ygol").getAttribute("matsrc"));
    if (document.querySelector("ygol").getAttribute("sleevesrc"))
      this.changeSleeve(
        document.querySelector("ygol").getAttribute("sleevesrc")
      );
    const observer = new MutationObserver(this.mutationUpdate.bind(this));
    observer.observe(document.querySelector("ygol"), {
      attributes: true,
    });
  }
  //update when attributes of <ygol> are changed
  mutationUpdate(mutations) {
    for (let mutation of mutations) {
      if (mutation.type === "attributes") {
        switch (mutation.attributeName) {
          case "matsrc":
            this.changeMat(
              document.querySelector("ygol").getAttribute("matsrc")
            );
            break;
          case "sleevesrc":
            this.changeSleeve(
              document.querySelector("ygol").getAttribute("sleevesrc")
            );
            break;
          default:
            if (document.querySelector("ygol").getAttribute("yld")) {
              this.loadYld(document.querySelector("ygol").getAttribute("yld"));
            } else if (document.querySelector("ygol").getAttribute("ydk")) {
              this.loadYdk(document.querySelector("ygol").getAttribute("ydk"));
            } else if (document.querySelector("ygol").getAttribute("dlf2pV2")) {
              this.loadDlf2pV2(
                document.querySelector("ygol").getAttribute("dlf2pV2")
              );
            }
        }
        break;
      }
    }
  }
  async loadDeckFromNamelist(namelist) {
    this.deleteDeck();
    let maindeck = namelist.split("#main")[1].split("#extra")[0].split("\n");
    let extradeck = namelist.split("#extra")[1].split("!side")[0].split("\n");
    for (let i = 0; i < maindeck.length; i++) {
      if (maindeck[i] && maindeck[i] != "\r")
        await this.screen.addObjectImg(
          `main${i}`,
          this.noimage,
          1134,
          514,
          120, //360
          175, //525
          {
            angle: 0,
            isDraggable: true,
            cardname: maindeck[i],
            list: null,
            isFaceup: false,
            errorSrc: this.errorimage,
          }
        );
    }
    for (let i = 0; i < extradeck.length; i++) {
      if (extradeck[i] && extradeck[i] != "\r")
        await this.screen.addObjectImg(
          `extra${i}`,
          this.noimage,
          26,
          514,
          120,
          175,
          {
            angle: 0,
            isDraggable: true,
            cardname: extradeck[i],
            list: null,
            isFaceup: false,
            errorSrc: this.errorimage,
          }
        );
    }
    this.originalObjectList = structuredClone(this.screen.objectList);
    this.preloadImages();
    for (let el of this.screen.objectList) {
      if (el.id == "lp-num")
        el.meta.text = maindeck.length < 40 ? "4000" : "8000";
    }
    let l = this.screen.objectList;
    console.log({ l });
  }
  loadYld(yld) {
    this.yld = yld;
    this.loadDeckFromNamelist(this.ygolDeck.yld_to_namelist(yld));
  }
  loadYdk(ydk) {
    this.ydk = ydk;
    this.loadDeckFromNamelist(this.ygolDeck.ydk_to_namelist(ydk));
  }
  loadDlf2pV2(dlf2pV2) {
    this.loadDeckFromNamelist(this.ygolDeck.dlf2pV2_to_namelist(dlf2pV2));
  }
  deleteDeck() {
    for (let el of this.screen.objectList) {
      if (el.id.includes("main") || el.id.includes("extra"))
        this.screen.removeObject(el.id);
    }
  }
  preloadImages() {
    for (let el of this.screen.objectList) {
      if (el.meta.cardname) {
        const i = document.createElement("img");
        i.src = this.url(`cards/${this.name_url(el.meta.cardname)}.jpg`);
        document.getElementById("ygol-cnv-images").appendChild(i);
      }
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
  openMenu() {
    this.screen.addObjectRect("menu-bg", "#000000cc", 0, 0, 1280, 720, {
      isDraggable: false,
    });
    this.screen.moveToFront("menu-toggle");
    this.screen.addObjectRect(
      "menu-btn-import",
      this.hitboxColor,
      20,
      100,
      500,
      30
    );
    this.screen.addObjectText("menu-txt-import", "#ffffff", 20, 100, 1000, {
      text: "Import deck from clipboard",
      fontSize: "30pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectRect(
      "menu-btn-reset",
      this.hitboxColor,
      20,
      180,
      500,
      30
    );
    this.screen.addObjectText("menu-txt-reset", "#ffffff", 20, 180, 1000, {
      text: "Reset field",
      fontSize: "30pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("info-txt1", "#ffffff", 700, 430, 800, {
      text: "How to use:",
      fontSize: "15pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("info-txt2", "#ffffff", 700, 470, 800, {
      text: "Drag: place cards",
      fontSize: "15pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("info-txt3", "#ffffff", 700, 510, 800, {
      text: "Left click: view deck/extra deck/gy, change battle position",
      fontSize: "15pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("info-txt4", "#ffffff", 700, 550, 800, {
      text: "Left click (hold): check card details",
      fontSize: "15pt",
      fontFamily: "Bahnschrift light",
    });
    this.screen.addObjectText("info-txt5", "#ffffff", 700, 590, 800, {
      text: "Right click: flip card, shuffle deck",
      fontSize: "15pt",
      fontFamily: "Bahnschrift light",
    });
  }
  closeMenu() {
    this.screen.removeObject("menu-bg");
    this.screen.removeObject("menu-btn-import");
    this.screen.removeObject("menu-txt-import");
    this.screen.removeObject("menu-btn-reset");
    this.screen.removeObject("menu-txt-reset");
    for (let i = 1; i < 6; i++) {
      this.screen.removeObject(`info-txt${i}`);
    }
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
      if (obj.meta.cardname) {
        const pile = this.screen
          .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
          .filter((a) => a.id.includes("snapzone-p"))[0];
        obj.meta.list = { x: pile.x, y: pile.y };
        obj.x = pos.x;
        obj.y = pos.y;
        document.getElementById(obj.id).src = this.url(
          `cards/${this.name_url(obj.meta.cardname)}.jpg`
        );
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
          ? this.url(`cards/${this.name_url(obj.meta.cardname)}.jpg`)
          : this.noimage;
      }
    }
  }
  flipCard(el) {
    if (el.meta.cardname) {
      document.getElementById(el.id).src = el.meta.isFaceup
        ? this.noimage
        : this.url(`cards/${this.name_url(el.meta.cardname)}.jpg`);
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
            this.noimage,
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
      if (el.meta.cardname) document.getElementById(el.id).src = this.noimage;
    }
    this.screen.objectList = structuredClone(this.originalObjectList);
  }
  mousedown(event) {
    this.isMouseDown = true;
    this.mouseHoldingDown = "pending";
    this.clicksWithinDelay += 1;
    const rect = this.screen.canvas.getBoundingClientRect();
    this.mousedownPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    this.movingObject = this.screen
      .clickedObjects(this.mousedownPos.x, this.mousedownPos.y)
      .at(-1).id;
    setTimeout(() => {
      if (this.mouseHoldingDown == "pending" && this.clicksWithinDelay == 1)
        this.mouseHoldingDown = "true";
      this.clicksWithinDelay -= 1;
    }, this.mouseHoldDelay * 1000);
  }
  mousemove(event) {
    if (this.isMouseDown) {
      //drag card
      const rect = this.screen.canvas.getBoundingClientRect();
      if (
        this.mousedownPos.x != event.clientX - rect.left ||
        this.mousedownPos.y != event.clientY - rect.top
      ) {
        this.mouseHoldingDown = "false";
        for (let obj of this.screen.objectList) {
          if (obj.id == this.movingObject && obj.meta.isDraggable) {
            if (!this.movingObjectOgPos)
              this.movingObjectOgPos = {
                x: obj.x,
                y: obj.y,
                isList: !!obj.meta.list,
              };
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
  }
  async mouseup(event) {
    this.isMouseDown = false;
    if (this.mouseHoldingDown == "true") {
      this.mouseHoldingDown = "false";
    } else {
      this.mouseHoldingDown = "false";
      const rect = this.screen.canvas.getBoundingClientRect();
      this.mouseupPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      if (
        this.mousedownPos.x != this.mouseupPos.x ||
        this.mousedownPos.y != this.mouseupPos.y
      ) {
        //handle drag
        //snap card to zone
        let illegal = this.screen.objectList.filter(
          (a) => a.id == this.movingObject
        )[0].meta.isDraggable;
        for (let clicked of this.screen.clickedObjects(
          this.mouseupPos.x,
          this.mouseupPos.y
        )) {
          if (clicked.id.includes("snapzone")) {
            illegal = false;
            for (let obj of this.screen.objectList) {
              if (obj.id == this.movingObject && obj.meta.isDraggable) {
                if (clicked.id == "snapzone-hand") {
                  obj.y = 545;
                  if (!obj.meta.isFaceup) this.flipCard(obj);
                } else {
                  obj.x = clicked.x + 30;
                  obj.y = clicked.y;
                }
                if (!clicked.id.includes("snapzone-m")) obj.meta.angle = 0;
              }
            }
          }
        }
        //return to original pos if not snapped
        if (illegal && !this.allowIllegalPlacement) {
          for (let obj of this.screen.objectList) {
            if (obj.id == this.movingObject) {
              if (this.movingObjectOgPos.isList) {
                obj.x = 300;
                obj.y = 545;
              } else {
                obj.x = this.movingObjectOgPos.x;
                obj.y = this.movingObjectOgPos.y;
              }
            }
          }
        }
        this.movingObjectOgPos = null;
      }
      this.spreadHand();
      if (
        Math.abs(this.mousedownPos.x - this.mouseupPos.x) <
          this.snapTolerance &&
        Math.abs(this.mousedownPos.y - this.mouseupPos.y) < this.snapTolerance
      ) {
        //handle click
        if (event.which == 1) {
          let closedCardList = false;
          //left click
          if (
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.id == "list-bg").length
          ) {
            this.closeCardList();
            closedCardList = true;
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
            if (el.meta.cardname)
              el.meta.angle = el.meta.angle == 270 ? 0 : 270;
          }
          if (
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.id.includes("snapzone-p")).length &&
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.meta.cardname).length
          ) {
            this.openCardList();
          }
          if (this.screen.objectList.filter((a) => a.id == "menu-bg").length) {
            //handle clicked menu button
            if (
              this.screen
                .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
                .filter((a) => a.id == "menu-btn-reset").length
            ) {
              this.resetField();
            }
            if (
              this.screen
                .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
                .filter((a) => a.id == "menu-btn-import").length
            ) {
              let clip = await navigator.clipboard.readText();
              if (!clip) {
                alert("Error: No deck in clipboard");
              } else {
                try {
                  this.loadYdk(this.ygolDeck.convert(clip, "ydk"));
                } catch (e) {
                  alert("Error: Invalid deck in clipboard");
                }
              }
            }
            this.closeMenu();
          } else if (
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.id == "menu-toggle").length
          ) {
            this.openMenu();
          } else if (
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.id == "lp-box").length &&
            !closedCardList
          ) {
            for (let el of this.screen.objectList) {
              if (el.id == "lp-num") {
                el.color = el.color == "#ffffff" ? "#33ff33" : "#ffffff";
                if (el.color == "#ffffff") this.changingLifePoints = false;
              }
            }
          }
          if (
            this.screen
              .clickedObjects(this.mouseupPos.x, this.mouseupPos.y)
              .filter((a) => a.id == "dice").length &&
            !closedCardList
          ) {
            for (let el of this.screen.objectList) {
              if (el.id == "dice") this.rollDice();
            }
          }
        }
        if (event.which == 3) {
          //right click
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
      if (!isNaN(event.key)) {
        for (let el of this.screen.objectList) {
          if (el.id == "lp-num" && el.color != "#ffffff") {
            if (this.changingLifePoints) {
              el.meta.text += event.key;
            } else {
              this.changingLifePoints = true;
              el.meta.text = event.key;
            }
          }
        }
      }
      if (event.key == "Backspace") {
        for (let el of this.screen.objectList) {
          if (el.id == "lp-num" && el.color != "#ffffff")
            el.meta.text = el.meta.text.slice(0, -1);
        }
      }
    }
  }
  changeMat(src) {
    if (document.querySelector("ygol").getAttribute("matsrc") != src)
      document.querySelector("ygol").setAttribute("matsrc", src);
    document.getElementById("fieldbg").src = src;
  }
  changeSleeve(src) {
    if (document.querySelector("ygol").getAttribute("sleevesrc") != src)
      document.querySelector("ygol").setAttribute("sleevesrc", src);
    for (let el of document
      .getElementById("ygol-cnv-images")
      .querySelectorAll("img")) {
      if (el.src == this.noimage) el.src = src;
    }
    this.noimage = src;
  }
  rollDice(i) {
    if (i != 5) {
      let src = document.getElementById("dice").src;
      while (src == document.getElementById("dice").src) {
        src =
          document.getElementById("dice").src.slice(0, -5) +
          `${Math.floor(Math.random() * 6) + 1}.png`;
      }
      document.getElementById("dice").src = src;
      setTimeout(() => {
        this.rollDice(i ? i + 1 : 1);
      }, 60);
    }
  }
}
