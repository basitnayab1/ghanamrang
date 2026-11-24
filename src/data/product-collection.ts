import type { ColorOption, Product, SizeChart } from "./catalog";

const skirtChart: SizeChart = {
  unit: "",
  head: ["Size", "Skirt length", "Shirt length", "Chest", "Sleeves"],
  rows: [["Small", "40", "25", "32", "14"], ["Medium", "42", "27", "34", "15"], ["Large", "44", "30", "34", "15"]],
};

const abayaChart: SizeChart = {
  unit: "",
  head: ["Size", "Length", "Chest", "Bottom"],
  rows: [["Small", "46", "28", "36"], ["Medium", "48", "30", "38"], ["Large", "50", "32", "40"]],
};

const noChart: SizeChart = { unit: "", head: [], rows: [] };
const sizes = ["S", "M", "L"];

function gallery(id: string, name: string, swatch: string): ColorOption[] {
  const photo = (view: string) => `/products/${id}/shop/${view}.webp`;
  const closeUp = id === "black-hood-abaya" ? "landscape-hood-closeup" : "landscape-closeup";
  const views = ["hero-model", "hanger", "hero-landscape", closeUp];
  if (id === "black-hood-abaya") views.push("landscape-court-bench");
  views.push("collage-four-poses");
  return [{ name, swatch, modelImage: photo("hero-model"), closeUpImage: photo(closeUp), railImage: photo("hanger"), images: views.map(photo) }];
}

function textile(fabric: string, season: string, ...details: string[]) {
  return { fabric, season, details: [fabric, season, ...details] };
}

const kiftar = {
  family: "Kiftar",
  category: "kiftar-sets", price: 5850, sizes, sizeChart: skirtChart, advanceOnly: true, isNew: true,
  pieces: ["Hooded top", "Matching maxi skirt"],
  ...textile("Polyester", "All seasons", "Wash with care."),
} satisfies Partial<Product>;

const nezha = {
  family: "Nezha",
  category: "nezha-sets", price: 6750, advanceOnly: true, isNew: true,
  pieces: ["Top with knotted front fastenings", "Matching maxi skirt"],
} satisfies Partial<Product>;

const hoodAbaya = {
  family: "Hood Abaya",
  category: "abaya-sets", price: 7000, sizes, sizeChart: abayaChart, isNew: true,
  pieces: ["Long hooded abaya top", "Matching wide-leg trousers"],
  ...textile("Urwa", "All seasons", "Fabric imported from China", "Estimated durability of 3 to 4 years", "Wash with care."),
} satisfies Partial<Product>;

export const productCollection: Product[] = [
  {
    ...hoodAbaya, id: "a-line-hood-abaya", name: "A-line Hood Abaya",
    colors: gallery("a-line-hood-abaya", "Cream", "#e4d7bf"),
    description: "A cream A-line top with open cuffs and side slits, paired with wide-leg trousers.",
  },
  {
    ...hoodAbaya, id: "black-hood-abaya", name: "Black Hood Abaya",
    colors: gallery("black-hood-abaya", "Black", "#191919"),
    description: "A long black hooded top with gathered cuffs, worn over matching wide-leg trousers.",
  },
  {
    ...kiftar, id: "black-kiftar", name: "Black Kiftar", price: 6200,
    colors: gallery("black-kiftar", "Black", "#191919"),
    description: "A relaxed hooded top and long skirt in textured black Irish fabric.",
    ...textile("Textured Irish", "Summer friendly"),
  },
  {
    ...kiftar, id: "olive-green-kiftar", name: "Olive Green Kiftar",
    colors: gallery("olive-green-kiftar", "Olive Green", "#555b48"),
    description: "A loose olive green hooded top with a matching full-length skirt.",
  },
  {
    ...kiftar, id: "brown-kiftar", name: "Brown Kiftar",
    colors: gallery("brown-kiftar", "Brown", "#705144"),
    description: "A warm brown two-piece with a softly draped hood and a flowing maxi skirt.",
  },
  {
    ...kiftar, id: "blue-kiftar", name: "Blue Kiftar",
    colors: gallery("blue-kiftar", "Blue", "#667c93"),
    description: "A muted blue hooded top with loose sleeves and a matching maxi skirt.",
  },
  {
    ...nezha, id: "black-nezha", name: "Black Nezha", sizes, sizeChart: skirtChart,
    colors: gallery("black-nezha", "Black", "#191919"),
    description: "A black Irish georgette top with knotted front fastenings and a full-length skirt.",
    ...textile("Irish georgette", "All seasons", "Wash with care. Avoid drying in direct sunlight."),
  },
  {
    ...nezha, id: "mahogany-nezha", name: "Mahogany Nezha", sizes: [], sizeChart: noChart,
    colors: gallery("mahogany-nezha", "Mahogany", "#59363b"),
    description: "A mahogany Irish georgette set with wide sleeves, knotted front fastenings and a flowing skirt.",
    ...textile("Irish georgette", "Summer friendly", "Wash with care."),
  },
  {
    id: "chadar", name: "Chadar", category: "chadars", price: 4500, isNew: true,
    colors: gallery("chadar", "Black", "#191919"), sizes: ["One size"], sizeChart: noChart,
    pieces: ["One rectangular chadar"],
    description: "A black Korean georgette chadar measuring 68 × 110 inches.",
    ...textile("Korean georgette", "All seasons", "Wash with care."),
  },
];
