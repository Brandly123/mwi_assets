const svgns = "http://www.w3.org/2000/svg";
const assets = document.getElementById("assets");
const fileSelect = document.getElementById("file");
const sizeSelect = document.getElementById("size");
const searchInput = document.getElementById("search");

let assetUrl = "/mwi_assets/assets/skills.svg";
let spriteElements = [];


function applyFilter(query) {
  const normalized = query.trim().toLowerCase();

  spriteElements.forEach(({ element, id }) => {
    const matches =
      !normalized ||
      id.toLowerCase().includes(normalized) ||
      id.replaceAll("_", " ").toLowerCase().includes(normalized);

    element.style.display = matches ? "" : "none";
  });
}

async function download(sprite, size) {
  const res = await fetch(assetUrl);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const symbol = doc.querySelector(`symbol#${CSS.escape(sprite)}`);
  if (!symbol) return;

  const serializer = new XMLSerializer();
  const tempDoc = document.implementation.createDocument(svgns, "svg", null);
  const root = tempDoc.documentElement;

  root.setAttribute("xmlns", svgns);
  root.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  root.setAttribute("viewBox", symbol.getAttribute("viewBox"));

  const wrapper = tempDoc.createElementNS(svgns, "g");
  Array.from(symbol.attributes).forEach((attr) => {
    if (attr.name !== "id" && attr.name !== "viewBox") wrapper.setAttribute(attr.name, attr.value);
  });

  Array.from(symbol.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) wrapper.appendChild(tempDoc.adoptNode(child.cloneNode(true)));
  });

  root.appendChild(wrapper);

  const svgText = serializer.serializeToString(root);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = svgDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  const pngBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!pngBlob) return;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(pngBlob);
  a.download = `${sprite}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function createSpriteElement(sprite) {
  const svg = document.createElementNS(svgns, "svg");
  svg.role = "img"

  const use = document.createElementNS(svgns, "use");
  use.setAttribute("href", `${assetUrl}#${sprite}`);
  svg.appendChild(use);

  svg.addEventListener("click", () => download(sprite, parseInt(sizeSelect.value)));

  return svg;
}

function renderSprites(sprites) {
  assets.innerHTML = "";
  spriteElements = [];

  for (const sprite of sprites) {
    const element = createSpriteElement(sprite);
    spriteElements.push({ element, id: sprite });
    assets.appendChild(element);
  }

  applyFilter(searchInput.value);
}

async function getSprites(url) {
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  return [...doc.querySelectorAll("symbol[id]")].map((el) => el.id);
}
function switchAssetFile() {
  assetUrl = `/mwi_assets/assets/${fileSelect.value}.svg`
  getSprites(assetUrl).then(renderSprites);
}
switchAssetFile()