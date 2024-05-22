class YgolDeck {
  constructor(db, ygolID, isRush) {
    this.db = db;
    this.ygolID = ygolID;
    this.isRush = isRush;
  }
  convert(d, format) {
    switch (format) {
      case "yld":
        return this.namelist_to_yld(this.toNamelist(d));
      case "ydk":
        return this.namelist_to_ydk(this.toNamelist(d));
      case "ydke":
        return this.ydk_to_ydke(this.namelist_to_ydk(this.toNamelist(d)));
      case "dlf2pV2":
        return this.namelist_to_dlf2pV2(this.toNamelist(d));
    }
  }
  toNamelist(d) {
    if (d.includes("#main") || d.includes("#extra")) {
      return this.ydk_to_namelist(d);
    } else if (d.includes("ydke://")) {
      return this.ydk_to_namelist(this.ydke_to_ydk(d));
    } else if (d.includes("yld://")) {
      return this.yld_to_namelist(d);
    } else if (d.slice(0, 2) == "3_") {
      //dlf2pv3
    } else {
      return this.dlf2pV2_to_namelist(d);
    }
  }
  isEDMonster(name) {
    let card = this.db.filter((a) => a.name == name)[0];
    return (
      card.monsterType.includes("Fusion") ||
      card.monsterType.includes("Synchro") ||
      card.monsterType.includes("Xyz") ||
      card.monsterType.includes("XYZ") ||
      card.monsterType.includes("Link")
    );
  }
  ydk_to_ydke(ydk) {
    function Uint32Array_to_ydke(main, extra, side) {
      function passcodesToBase64(passcodes) {
        const bytes = new Uint8Array(passcodes.buffer);
        let binaryString = "";
        for (let i = 0; i < bytes.length; i++) {
          binaryString += String.fromCharCode(bytes[i]);
        }
        return btoa(binaryString);
      }
      return (
        "ydke://" +
        passcodesToBase64(main) +
        "!" +
        passcodesToBase64(extra) +
        "!" +
        passcodesToBase64(side) +
        "!"
      );
    }
    function stringsToUint32Array(stringsArray) {
      const uint32Array = new Uint32Array(stringsArray.length);
      for (let i = 0; i < stringsArray.length; i++)
        uint32Array[i] = parseInt(stringsArray[i], 10);
      return uint32Array;
    }
    let main = ydk
      .split("#main")[1]
      .split("#extra")[0]
      .split("\n")
      .filter((a) => a != "");
    let extra = ydk
      .split("#extra")[1]
      .split("!side")[0]
      .split("\n")
      .filter((a) => a != "");
    let side = ydk
      .split("!side")[1]
      .split("\n")
      .filter((a) => a != "");
    return Uint32Array_to_ydke(
      stringsToUint32Array(main),
      stringsToUint32Array(extra),
      stringsToUint32Array(side)
    );
  }
  ydke_to_ydk(ydke) {
    function ydke_to_Uint32Array(ydke) {
      function base64ToPasscodes(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Uint32Array(bytes.buffer);
      }
      const components = ydke.slice("ydke://".length).split("!");
      return {
        main: base64ToPasscodes(components[0]),
        extra: base64ToPasscodes(components[1]),
        side: base64ToPasscodes(components[2]),
      };
    }
    return JSON.stringify(ydke_to_Uint32Array(ydke))
      .replace('"main"', "#main")
      .replace('"extra"', "#extra")
      .replace('"side"', "!side")
      .replace(/{/g, "")
      .replace(/}/g, "")
      .replace(/:/g, ",")
      .split(",")
      .filter((a) => !a.includes('"'))
      .join("\n");
  }
  ydk_to_namelist(ydk) {
    let arr = ydk
      .split("\n")
      .filter(
        (a) =>
          !isNaN(a) ||
          a.includes("#main") ||
          a.includes("#extra") ||
          a.includes("!side")
      );
    for (let i = 0; i < arr.length; i++) {
      if (!isNaN(arr[i]) && arr[i][0] != "#" && arr[i][0] != "!") {
        arr[i] = this.db.filter((a) => a.konamiID == Number(arr[i]))[0].name;
      }
    }
    return arr.join("\n");
  }
  namelist_to_ydk(namelist) {
    let arr = namelist.split("\n");
    for (let i = 0; i < arr.length; i++) {
      let card = this.db.filter(
        (a) => a.name == arr[i] && (this.isRush ? a.rush : !a.rush)
      );
      if (card.length) arr[i] = card[0].konamiID || arr[i];
    }
    return arr.join("\n");
  }
  yld_to_namelist(yld) {
    let arr = this.base13Encode(this.base64Decode(yld.replace("yld://", "")))
      .slice(1)
      .replace(/a/g, "xxxxx")
      .replace(/b/g, "xxxxxxxxxx")
      .replace(/c/g, "yyyyy")
      .match(/.{1,5}/g);
    let d = "#main\n";
    let prev = 0;
    for (let el of arr) {
      if (el == "yyyyy" && !d.includes("!side")) {
        d += d.includes("#extra") ? "!side\n" : "#extra\n";
      } else {
        d += this.ygolID[el == "xxxxx" ? prev : Number(el)] + "\n";
        if (el != "xxxxx") prev = Number(el);
      }
    }
    return d;
  }
  namelist_to_yld(namelist) {
    let d = "1";
    let prev = "";
    for (let el of namelist.split("\n")) {
      if (el.includes("#extra") || el.includes("!side")) {
        d += "c";
      } else if (this.ygolID.indexOf(el) != -1) {
        let curr = ("0000" + this.ygolID.indexOf(el)).slice(-5);
        d += prev == curr ? "a" : curr;
        prev = curr;
        d = d.replace("aa", "b");
      }
    }
    return "yld://" + this.base64Encode(this.base13Decode(d));
  }
  dlf2pV2_to_namelist(dlf2pV2) {
    let c = dlf2pV2.split("_")[0] == "2" ? dlf2pV2.slice(2) : dlf2pV2;
    let split = decodeURIComponent(c).split("_");
    let arr = this.base13Encode(this.base63Decode(split[0]));
    if (arr[0] != "a") arr = "0" + arr;
    arr = arr
      .replace(/a/g, "00")
      .replace(/c/g, "bb")
      .replace(/b/g, "xxxxxxxxxx")
      .match(/.{1,10}/g);
    let d = [];
    for (let el of arr) {
      d.push(
        el == "xxxxxxxxxx"
          ? d.at(-1)
          : this.db.filter((a) => a.konamiID == Number(el))[0].name
      );
    }
    let main = d.filter((a) => !this.isEDMonster(a));
    let extra = d.filter((a) => this.isEDMonster(a));
    if (split[3])
      for (let el of split[3].split("-")) {
        if (this.isEDMonster(el)) {
          extra.push(el);
        } else {
          main.push(el);
        }
      }
    return `#main\n${main.join("\n")}\n#extra\n${extra.join("\n")}`;
  }
  namelist_to_dlf2pV2(namelist) {
    let darr = [];
    let special = [];
    let prev = "";
    for (let el of namelist.split("\n")) {
      if (el.includes("!side")) break;
      if (!el.includes("#main") && !el.includes("#extra")) {
        let card = this.db.filter((a) => a.name == el)[0];
        if (card.konamiID) {
          let id = ("000000000" + card.konamiID).slice(-10);
          darr.push(id == prev ? "b" : id);
          prev = id;
        } else {
          special.push(el);
        }
      }
    }
    return `${this.base63Encode(
      this.base13Decode(darr.join("").replace(/bb/g, "c").replace(/00/g, "a"))
    )}_-1_Deck${special.length ? `_${special.join("-")}` : ""}`;
  }
  base64Encode(str) {
    if (str == "-1") return "-1";
    let input = BigInt(str);
    let chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let result = "";
    while (input > 0n) {
      result = chars[input - (input / 64n) * 64n] + result;
      input = BigInt(input / 64n);
    }
    return result;
  }
  base64Decode(str) {
    if (str == "-1") return "-1";
    let result = 0n;
    let chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (let i = str.length - 1; i >= 0; i--) {
      result +=
        BigInt(chars.indexOf(str[i])) * 64n ** BigInt(str.length - 1 - i);
    }
    return result;
  }
  base13Encode(str) {
    if (str == "-1") return "-1";
    let input = BigInt(str);
    let chars = "0123456789abc";
    let result = "";
    while (input > 0n) {
      result = chars[input - (input / 13n) * 13n] + result;
      input = BigInt(input / 13n);
    }
    return result;
  }
  base13Decode(str) {
    if (str == "-1") return "-1";
    let result = 0n;
    let chars = "0123456789abc";
    for (let i = str.length - 1; i >= 0; i--) {
      result +=
        BigInt(chars.indexOf(str[i])) * 13n ** BigInt(str.length - 1 - i);
    }
    return result;
  }
  base63Encode(str) {
    if (str == "-1") return "-1";
    let input = BigInt(str);
    let chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-";
    let result = "";
    while (input > 0n) {
      result = chars[input - (input / 63n) * 63n] + result;
      input = BigInt(input / 63n);
    }
    return result;
  }
  base63Decode(str) {
    if (str == "-1") return "-1";
    let result = 0n;
    let chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-";
    for (let i = str.length - 1; i >= 0; i--) {
      result +=
        BigInt(chars.indexOf(str[i])) * 63n ** BigInt(str.length - 1 - i);
    }
    return result;
  }
}
