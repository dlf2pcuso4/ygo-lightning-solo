//run this inside duellinksmeta.com
function makeValidFileName(str) {
  let fileName = str.replace(/[^a-zA-Z0-9\s_\-\.\(\)%]/g, "");
  fileName = fileName.replace(/\s+/g, "_");
  return fileName.substring(0, 255);
}
function downloadResizedImage(imageUrl, width, height, name) {
  return new Promise((resolve, reject) => {
    const tempImg = new Image();
    tempImg.crossOrigin = "Anonymous";
    tempImg.src = imageUrl;
    tempImg.onload = () => {
      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(tempImg, 0, 0, width, height);
        const dataURL = tempCanvas.toDataURL("image/jpeg");
        const tempLink = document.createElement("a");
        tempLink.href = dataURL;
        tempLink.download = name;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        tempCanvas.remove();
        tempImg.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    tempImg.onerror = () => {
      reject(new Error("Failed to load the image."));
    };
  });
}
function addScript(name) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = name;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
(async () => {
  await addScript("https://dlf2p.com/lib/carddb-dl.js");
  await addScript("https://dlf2p.com/lib/carddb-md.js");
  let missingCards = jsonResponseDl
    .filter((a) => a.rush)
    .concat(jsonResponseMd.filter((a) => !a.rarity));
  for (let i = 0; i < missingCards.length; i++) {
    await downloadResizedImage(
      `https://s3.duellinksmeta.com/cards/${missingCards[i]._id}_w420.webp`,
      768,
      1126,
      makeValidFileName(
        `${missingCards[i].name}${missingCards[i].rush ? " [RUSH]" : ""}.jpg`
      )
    );
  }
})();
