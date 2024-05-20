//manages the screen rendering loop and events
(async () => {
  await addScript("v1/screen.class.js");
  const screen = new Screen("1280", "720");
  document.getElementById("ygol-mainDiv").appendChild(screen.canvas);
  screen.canvas.oncontextmenu = () => false;
  await screen.addObjectImg("fieldbg", "v1/fieldbg.png", 0, 0, 1280, 720, {
    isDraggable: false,
  });
  await screen.addObjectImg("field", "v1/field.png", 0, 0, 1280, 720, {
    isDraggable: false,
  });
  for (let i = 0; i < 5; i++) {
    screen.addObjectRect(
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
    screen.addObjectRect(
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
  screen.addObjectRect(`snapzone-me1`, "#00000000", 363, 26, 180, 175, {
    isDraggable: false,
  });
  screen.addObjectRect(`snapzone-me2`, "#00000000", 737, 26, 180, 175, {
    isDraggable: false,
  });
  for (let i = 0; i < 3; i++) {
    screen.addObjectRect(
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
  screen.addObjectRect(`snapzone-f`, "#00000000", -4, 327, 180, 175, {
    isDraggable: false,
  });
  screen.addObjectRect(`snapzone-pe`, "#00000000", -4, 514, 180, 175, {
    isDraggable: false,
  });
  screen.addObjectRect(`snapzone-hand`, "#00000000", 200, 600, 880, 120, {
    isDraggable: false,
  });

  setInterval(() => {
    screen.render();
  }, 1000 / 60);

  let maindeck = [];
  let extradeck = [];
  let snapTolerance = 30;
  let mousedownPos = { x: 0, y: 0 };
  let mouseupPos = { x: 0, y: 0 };
  let isMouseDown = false;
  let movingObject = "";
  let scrollY = 0;
  let originalObjectList;
  let shuffling = false;

  function preloadImages() {
    for (let el of screen.objectList) {
      const i = document.createElement("img");
      i.src = `https://dlf2p.com/images/cards/${el.meta.cardid}.jpg`;
      document.getElementById("ygol-cnv-images").appendChild(i);
    }
  }
  function shuffle(arr) {
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
  function openCardList() {
    scrollY = 0;
    screen.addObjectRect("list-bg", "#000000aa", 0, 0, 1280, 720, {
      isDraggable: false,
    });
    let pos = { x: 0, y: 0 };
    for (let obj of screen.clickedObjects(mouseupPos.x, mouseupPos.y)) {
      if (obj.meta.cardid) {
        const pile = screen
          .clickedObjects(mouseupPos.x, mouseupPos.y)
          .filter((a) => a.id.includes("snapzone-p"))[0];
        obj.meta.list = { x: pile.x, y: pile.y };
        obj.x = pos.x;
        obj.y = pos.y;
        document.getElementById(
          obj.id
        ).src = `https://dlf2p.com/images/cards/${obj.meta.cardid}.jpg`;
        screen.moveToFront(obj.id);
        pos.x += 120;
        if (pos.x == 1200) {
          pos.x = 0;
          pos.y += 175;
        }
      }
    }
  }
  function closeCardList() {
    screen.removeObject("list-bg");
    for (let obj of screen.objectList) {
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
  function flipCard(el) {
    if (el.meta.cardid) {
      document.getElementById(el.id).src =
        document.getElementById(el.id).src ==
        "https://dlf2p.com/images/noimage.jpg"
          ? `https://dlf2p.com/images/cards/${el.meta.cardid}.jpg`
          : "https://dlf2p.com/images/noimage.jpg";
      el.meta.isFaceup = el.meta.isFaceup ? false : true;
    }
  }
  function spreadHand() {
    let handcount = screen.objectList.filter((a) => a.y == 545).length;
    let x = 640 - 60 * handcount;
    let hand = screen.objectList
      .filter((a) => a.y == 545)
      .sort((a, b) => a.x - b.x);
    let nonhand = screen.objectList.filter((a) => a.y != 545);
    for (let el of hand) {
      el.x = x;
      x += 120;
    }
    screen.objectList = nonhand.concat(hand);
  }
  async function shuffleDeck() {
    if (!shuffling) {
      shuffling = true;
      let isDeckOpen = screen.objectList.filter(
        (a) => a.x == 1134 && a.y == 514
      ).length
        ? false
        : true;
      if (isDeckOpen) closeCardList();
      let deckCards = screen.objectList.filter(
        (a) => a.x == 1134 && a.y == 514
      );
      let nonDeckCards = screen.objectList.filter(
        (a) => a.x != 1134 || a.y != 514
      );
      deckCards = shuffle(deckCards);
      screen.objectList = nonDeckCards.concat(deckCards);
      mouseupPos = { x: 1164, y: 554 };
      if (isDeckOpen) {
        openCardList();
        shuffling = false;
      } else {
        for (let i = 0; i < 5; i++) {
          await screen.addObjectImg(
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
            screen.removeObject(`shuffle${i}`);
          }
          shuffling = false;
        }, 100);
      }
    }
  }
  function resetField() {
    for (let el of screen.objectList) {
      if (el.meta.cardid)
        document.getElementById(
          el.id
        ).src = `https://dlf2p.com/images/noimage.jpg`;
    }
    screen.objectList = structuredClone(originalObjectList);
  }

  document.getElementById("ygol-resetField").onclick = () => resetField();
  document.getElementById("ygol-loadYdk").onclick = async () => {
    maindeck = document
      .getElementById("ygol-inputYdk")
      .value.split("#extra")[0]
      .split(" ")
      .filter((a) => !a.includes("#") && !a.includes("!") && a.length > 1);
    extradeck = document
      .getElementById("ygol-inputYdk")
      .value.split("#extra")[1]
      .split(" ")
      .filter((a) => !a.includes("#") && !a.includes("!") && a.length > 1);
    for (let i = 0; i < maindeck.length; i++) {
      await screen.addObjectImg(
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
      await screen.addObjectImg(
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
    originalObjectList = structuredClone(screen.objectList);
    preloadImages();
  };

  screen.canvas.addEventListener("mousedown", function (event) {
    isMouseDown = true;
    const rect = screen.canvas.getBoundingClientRect();
    mousedownPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    movingObject = screen
      .clickedObjects(mousedownPos.x, mousedownPos.y)
      .at(-1).id;
  });
  screen.canvas.addEventListener("mousemove", function (event) {
    if (isMouseDown) {
      //drag card
      const rect = screen.canvas.getBoundingClientRect();
      if (
        mousedownPos.x != event.clientX - rect.left ||
        mousedownPos.y != event.clientY - rect.top
      )
        for (let obj of screen.objectList) {
          if (obj.id == movingObject && obj.meta.isDraggable) {
            obj.x = event.clientX - rect.left - obj.width / 2;
            obj.y = event.clientY - rect.top - obj.height / 2;
            screen.moveToFront(movingObject);
            if (obj.meta.list) {
              obj.meta.list = null;
              obj.meta.isFaceup = true;
            }
            closeCardList();
          }
        }
    }
  });
  screen.canvas.addEventListener("mouseup", function (event) {
    isMouseDown = false;
    const rect = screen.canvas.getBoundingClientRect();
    mouseupPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    if (mousedownPos.x != mouseupPos.x || mousedownPos.y != mouseupPos.y) {
      //snap card to zone
      for (let clicked of screen.clickedObjects(mouseupPos.x, mouseupPos.y)) {
        if (clicked.id.includes("snapzone")) {
          for (let obj of screen.objectList) {
            if (obj.id == movingObject && obj.meta.isDraggable) {
              if (clicked.id == "snapzone-hand") {
                obj.y = 545;
              } else {
                obj.x = clicked.x + 30;
                obj.y = clicked.y;
                if (!clicked.id.includes("snapzone-m")) obj.meta.angle = 0;
              }
            }
          }
        }
      }
    }
    spreadHand();
    if (
      Math.abs(mousedownPos.x - mouseupPos.x) < snapTolerance &&
      Math.abs(mousedownPos.y - mouseupPos.y) < snapTolerance
    ) {
      if (event.which == 1) {
        if (
          screen
            .clickedObjects(mouseupPos.x, mouseupPos.y)
            .filter((a) => a.id == "list-bg").length
        ) {
          closeCardList();
        }
        if (
          screen
            .clickedObjects(mouseupPos.x, mouseupPos.y)
            .filter((a) => a.id.includes("snapzone-m")).length
        ) {
          //rotate card
          let el = screen.clickedObjects(mouseupPos.x, mouseupPos.y).at(-1);
          if (el.meta.cardid) el.meta.angle = el.meta.angle == 270 ? 0 : 270;
        }
        if (
          screen
            .clickedObjects(mouseupPos.x, mouseupPos.y)
            .filter((a) => a.id.includes("snapzone-p")).length &&
          screen
            .clickedObjects(mouseupPos.x, mouseupPos.y)
            .filter((a) => a.meta.cardid).length
        ) {
          openCardList();
        }
      }
      //flip card
      if (event.which == 3) {
        if (
          screen
            .clickedObjects(mouseupPos.x, mouseupPos.y)
            .filter((a) => a.id == "snapzone-pd").length
        ) {
          shuffleDeck();
        } else {
          flipCard(screen.clickedObjects(mouseupPos.x, mouseupPos.y).at(-1));
        }
      }
    }
  });
  //scroll card list
  window.addEventListener("wheel", function (event) {
    scrollY += event.deltaY;
    if (scrollY < 0) {
      scrollY -= event.deltaY;
    } else {
      for (let obj of screen.objectList) {
        if (obj.meta.list) {
          obj.y -= event.deltaY;
        }
      }
    }
  });
  window.addEventListener("keydown", function (event) {
    if (!isMouseDown) {
      if (event.key == "r") {
        resetField();
      }
      if (event.key == "s") {
        shuffleDeck();
      }
    }
  });
})();
//const t = screen.objectList;
//console.log({ t });
