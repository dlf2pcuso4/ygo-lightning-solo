//screen class containing list of objects to render and the render function
class Screen {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = width;
    this.canvas.height = height;
    this.objectList = [];
    document.body.insertAdjacentHTML(
      "beforeend",
      "<div id='ygol-cnv-images' style='display: none;'></div>"
    );
  }
  addObjectRect(id, color, x, y, width, height, meta = {}) {
    this.objectList.push({
      id: id,
      type: "CNV_RECT",
      color: color,
      src: null,
      width: width,
      height: height,
      x: x,
      y: y,
      meta: meta,
    });
  }
  addObjectImg(id, src, x, y, width, height, meta = {}) {
    //supported metadata: angle (degrees)
    this.objectList.push({
      id: id,
      type: "CNV_IMG",
      color: "#000000",
      src: src,
      width: width,
      height: height,
      x: x,
      y: y,
      meta: meta,
    });
    return new Promise((resolve, reject) => {
      const i = document.createElement("img");
      i.id = id;
      i.src = src;
      i.onload = resolve;
      i.onerror = () => {
        if (i.src == meta.altSrc) {
          i.src = meta.errorSrc;
        } else if (i.src == meta.errorSrc) {
          i.onerror = null;
          reject;
        } else if (meta.altSrc) {
          i.src = meta.altSrc;
        } else {
          i.src = meta.errorSrc;
        }
      };
      document.getElementById("ygol-cnv-images").appendChild(i);
    });
  }
  addObjectText(id, color, x, y, width, meta = {}) {
    this.objectList.push({
      id: id,
      type: "CNV_TXT",
      color: color,
      src: null,
      width: width,
      height: null,
      x: x,
      y: y,
      meta: meta,
    });
  }
  removeObject(id) {
    this.objectList = this.objectList.filter((a) => a.id != id);
    if (document.getElementById(id)) document.getElementById(id).remove();
  }
  drawRotatedImg(ctx, angle, id, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(id, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let obj of this.objectList) {
      switch (obj.type) {
        case "CNV_RECT":
          this.ctx.fillStyle = obj.color;
          this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          break;
        case "CNV_IMG":
          if (obj.meta.angle) {
            this.drawRotatedImg(
              this.ctx,
              obj.meta.angle,
              document.getElementById(obj.id),
              obj.x + obj.width / 2,
              obj.y + obj.height / 2,
              obj.width,
              obj.height
            );
          } else {
            this.ctx.drawImage(
              document.getElementById(obj.id),
              obj.x,
              obj.y,
              obj.width,
              obj.height
            );
          }
          break;
        case "CNV_TXT":
          function drawWrappedText(
            ctx,
            text,
            color = "#000000",
            width = Infinity,
            x = 0,
            y = 0,
            fontWeight = "",
            fontSize = "10pt",
            fontFamily = "Arial"
          ) {
            ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = "top";
            const words = text.split(" ");
            let line = "";
            let lineHeight = parseInt(fontSize, 10) * 1.6;
            function renderLine(line, x, y) {
              ctx.fillText(line, x, y);
              return y + lineHeight;
            }
            let currentY = y;
            for (let word of words) {
              const testLine = line + word + " ";
              const metrics = ctx.measureText(testLine);
              const testLineWidth = metrics.width;
              if (testLineWidth > width && line.length > 0) {
                currentY = renderLine(line, x, currentY);
                line = word + " ";
              } else {
                line = testLine;
              }
            }
            if (line.length > 0) {
              renderLine(line, x, currentY);
            }
          }
          drawWrappedText(
            this.ctx,
            obj.meta.text,
            obj.color,
            obj.width,
            obj.x,
            obj.y,
            obj.meta.fontWeight,
            obj.meta.fontSize,
            obj.meta.fontFamily
          );
      }
    }
  }
  clickedObjects(x, y) {
    let objs = [];
    for (let obj of this.objectList) {
      if (
        obj.x < x &&
        x < obj.x + obj.width &&
        obj.y < y &&
        y < obj.y + obj.height
      ) {
        objs.push(obj);
      }
    }
    return objs;
  }
  moveToFront(id) {
    let target = false;
    for (let obj of this.objectList) {
      if (obj.id == id) target = obj;
    }
    this.objectList = this.objectList.filter((a) => a.id != id);
    if (target) this.objectList.push(target);
  }
}
