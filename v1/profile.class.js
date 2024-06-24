class Profile {
  constructor(username) {
    this.username = username;
    this.mat = "";
    this.sleeve = "";
    this.decks = [];
  }
  scramble(txt) {
    const normal =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const scrambled =
      "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ9876543210";
    let result = "";
    for (let letter of txt) {
      if (normal.indexOf(letter) != -1) {
        result += scrambled[normal.indexOf(letter)];
      } else {
        result += letter;
      }
    }
    return result;
  }
  unscramble(txt) {
    const normal =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const scrambled =
      "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ9876543210";
    let result = "";
    for (let letter of txt) {
      if (normal.indexOf(letter) != -1) {
        result += normal[scrambled.indexOf(letter)];
      } else {
        result += letter;
      }
    }
    return result;
  }
  createURL() {
    return `${encodeURIComponent(
      this.scramble(this.username)
    )}/${encodeURIComponent(this.scramble(this.mat))}/${encodeURIComponent(
      this.scramble(this.sleeve)
    )}/${encodeURIComponent(this.scramble(JSON.stringify(this.decks)))}`;
  }
  unpackURL(url) {
    let split = url.split("/");
    this.username = this.unscramble(decodeURIComponent(split[0]));
    this.mat = this.unscramble(decodeURIComponent(split[1]));
    this.sleeve = this.unscramble(decodeURIComponent(split[2]));
    this.decks = JSON.parse(this.unscramble(decodeURIComponent(split[3])));
  }
}
