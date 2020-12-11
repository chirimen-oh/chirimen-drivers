import AMG8833 from "https://unpkg.com/@chirimen/amg8833?module";

// in celsius
const tMax = 40;
const tMin = 20;
const hMax = 0;
const hMin = 270;

initTable();

document.getElementById("tMaxTxt").innerText = tMax;
document.getElementById("tMinTxt").innerText = tMin;

main();

async function main() {
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const amg8833 = new AMG8833(port, 0x69);
  await amg8833.init();
  document.getElementById("init").remove();

  while (true) {
    const data = await amg8833.readData();
    heatMap(data);
    sleep(500);
  }
}

function initTable() {
  const tbl = document.getElementById("tImg");
  for (let i = 0; i < 8; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < 8; j++) {
      const td = document.createElement("td");
      td.id = "img" + j + "_" + i;
      td.innerText = "";
      td.style.backgroundColor = "#00A000";
      tr.appendChild(td);
    }
    tbl.appendChild(tr);
  }
}

function heatMap(tImage) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const tId = "img" + j + "_" + i;
      const td = document.getElementById(tId);
      const rgb = hsvToRgb(temperature2hue(tImage[i][j]), 1, 1);
      const colorCode = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
      td.style.backgroundColor = colorCode;
    }
  }
}

function temperature2hue(temp) {
  if (temp > tMax) {
    return hMax;
  } else if (temp < tMin) {
    return hMin;
  } else {
    const ans = ((hMax - hMin) / (tMax - tMin)) * (temp - tMin) + hMin;
    return ans;
  }
}

// from https://qiita.com/hachisukansw/items/633d1bf6baf008e82847
function hsvToRgb(H, S, V) {
  //https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV

  const C = V * S;
  const Hp = H / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));

  let R, G, B;
  // prettier-ignore
  {
    if (0 <= Hp && Hp < 1) {[R,G,B]=[C,X,0]};
    if (1 <= Hp && Hp < 2) {[R,G,B]=[X,C,0]};
    if (2 <= Hp && Hp < 3) {[R,G,B]=[0,C,X]};
    if (3 <= Hp && Hp < 4) {[R,G,B]=[0,X,C]};
    if (4 <= Hp && Hp < 5) {[R,G,B]=[X,0,C]};
    if (5 <= Hp && Hp < 6) {[R,G,B]=[C,0,X]};
  }

  const m = V - C;
  [R, G, B] = [R + m, G + m, B + m];

  R = Math.floor(R * 255);
  G = Math.floor(G * 255);
  B = Math.floor(B * 255);

  return [R, G, B];
}
