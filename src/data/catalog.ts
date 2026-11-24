/**
 * Ghanam Rang catalog.
 *
 * Built from the product photos and size charts the owner shared.
 * The original Open Abaya and Khimar entries still use provisional prices and charts.
 */

import { productCollection } from "./product-collection";

export type Category = "abaya-sets" | "khimar-sets" | "kiftar-sets" | "nezha-sets" | "chadars";

export const categories: { id: Category; label: string }[] = [
  { id: "abaya-sets", label: "Abaya Sets" },
  { id: "khimar-sets", label: "Khimar Sets" },
  { id: "kiftar-sets", label: "Kiftar Sets" },
  { id: "nezha-sets", label: "Nezha Sets" },
  { id: "chadars", label: "Chadars" },
];

export type ColorOption = {
  name: string;
  swatch: string;
  /** Garment photographed on a hanger for The Rail. */
  railImage: string;
  modelImage: string;
  closeUpImage?: string;
  /** Images shown across shop and product views. */
  images: string[];
};

export type SizeChart = { unit: string; head: string[]; rows: string[][] };

export type Product = {
  id: string;
  name: string;
  family?: string;
  category: Category;
  price: number | null;
  advanceOnly?: boolean;
  colors: ColorOption[];
  sizes: string[];
  sizeChart: SizeChart;
  pieces: string[];
  description: string;
  fabric?: string;
  season?: string;
  details: string[];
  isNew: boolean;
};

const SIZES = ["S", "M", "L"];

function collectionColor(id: string, name: string, swatch: string): ColorOption {
  const stem = "/products/generated/" + id + "/web/" + name.toLowerCase().replaceAll(" ", "-");
  const railImage = stem + "-hanger.webp";
  const modelImage = stem + "-model.webp";
  return { name, swatch, railImage, modelImage, images: [railImage, modelImage] };
}

export const products: Product[] = [
  ...productCollection,
  {
    id: "open-abaya-set",
    name: "Open Abaya Set",
    category: "abaya-sets",
    price: 7500, // placeholder
    colors: [{ name: "Mocha", swatch: "#69423a", modelImage: "/products/cutouts/mocha.webp", railImage: "/products/hangers/mocha.webp", images: ["/products/hangers/mocha.webp"] }],
    sizes: SIZES,
    sizeChart: {
      unit: "inches",
      head: ["Size", "Length", "Chest", "Bottom"],
      rows: [
        ["Small", "50", "30", "36"],
        ["Medium", "54", "30", "38"],
        ["Large", "57", "33", "40"],
      ],
    },
    pieces: ["Open abaya", "Inner dress", "Wide-leg trousers", "Matching hijab"],
    description:
      "A flowing open abaya with full balloon sleeves, layered over a matching inner dress and wide-leg trousers. Finished with a hijab in the same deep shade.",
    details: ["Relaxed, floor-skimming length", "Full balloon sleeves", "Wide-leg trousers included", "Hijab in the same colour"],
    isNew: true,
  },
  {
    id: "khimar-set",
    name: "Khimar Two-Piece Set",
    category: "khimar-sets",
    price: 5950, // placeholder
    colors: [
      {
        name: "Navy",
        modelImage: "/products/cutouts/navy-ball.webp",
        closeUpImage: "/products/khimar-set-navy-detail.jpg",
        swatch: "#48566b",
        railImage: "/products/hangers/navy.webp",
        images: ["/products/hangers/navy.webp"],
      },
      { name: "Olive", swatch: "#2f3a2f", modelImage: "/products/cutouts/olive.webp", railImage: "/products/hangers/olive.webp", images: ["/products/hangers/olive.webp"] },
    ],
    sizes: SIZES,
    sizeChart: {
      unit: "inches",
      head: ["Size", "Length", "Chest", "Bottom"],
      rows: [
        ["Small", "46", "28", "36"],
        ["Medium", "48", "30", "38"],
        ["Large", "50", "32", "40"],
      ],
    },
    pieces: ["Long khimar top", "Wide-leg trousers"],
    description:
      "An easy two-piece: a long, loose khimar top with side slits and gathered cuffs, paired with wide-leg trousers. Made to move in.",
    details: ["Loose, relaxed fit", "Elasticated, gathered cuffs", "Side slits for easy movement", "Wide-leg trousers included"],
    isNew: false,
  },
  {
    id: "lehar-abaya-set", name: "Lehar Abaya Set", category: "abaya-sets",
    price: null, sizes: [], sizeChart: { unit: "", head: [], rows: [] }, isNew: true,
    colors: [
      collectionColor("lehar-abaya-set", "Slate Indigo", "#475266"),
      collectionColor("lehar-abaya-set", "Cedar", "#344a39"),
      collectionColor("lehar-abaya-set", "Mulberry", "#603451"),
      collectionColor("lehar-abaya-set", "Sandstone", "#b88c63"),
    ],
    pieces: ["Lehar abaya top", "Matching wide-leg trousers"],
    description: "A curved line of stitching sweeps across a flared abaya top, worn over matching wide-leg trousers.",
    details: ["Wave-shaped front seam", "Gathered cuffs", "Flared hem"],
  },
  {
    id: "sahar-pleat-set", name: "Sahar Pleat Set", category: "abaya-sets",
    price: null, sizes: [], sizeChart: { unit: "", head: [], rows: [] }, isNew: true,
    colors: [
      collectionColor("sahar-pleat-set", "Aubergine", "#492439"),
      collectionColor("sahar-pleat-set", "Cypress", "#485746"),
      collectionColor("sahar-pleat-set", "Rose Clay", "#a66e67"),
      collectionColor("sahar-pleat-set", "Ocean", "#56758b"),
    ],
    pieces: ["Sahar pleated abaya top", "Matching wide-leg trousers"],
    description: "A single box pleat opens beneath a straight chest yoke. Deep button cuffs finish the sleeves.",
    details: ["Central box pleat", "Two-button cuffs", "Wide-leg trousers"],
  },
];

/** One entry per photographed outfit, used by the Try the Style carousel. */
export type Look = { id: string; title: string; productId: string; colorName: string; image: string };

export const looks: Look[] = [
  { id: "olive", title: "Olive Khimar", productId: "khimar-set", colorName: "Olive", image: "/products/hangers/olive.webp" },
  { id: "navy-walk", title: "Navy Khimar", productId: "khimar-set", colorName: "Navy", image: "/products/hangers/navy.webp" },
  { id: "mocha", title: "Mocha Abaya", productId: "open-abaya-set", colorName: "Mocha", image: "/products/hangers/mocha.webp" },
];

const byId = new Map(products.map((p) => [p.id, p]));
export const getProduct = (id: string) => byId.get(id);

export const findColor = (p: Product, name?: string | null) => p.colors.find((c) => c.name === name) ?? p.colors[0];

/** Every product/colour pair, for grids that show each colourway as its own card. */
export const colorways = products.flatMap((product) => product.colors.map((color) => ({ product, color })));

export const familyName = (product: Product) => product.family ?? product.name;
const groupedStyles = new Map<string, typeof colorways>();
for (const style of colorways) {
  const key = familyName(style.product);
  const styles = groupedStyles.get(key);
  if (styles) styles.push(style);
  else groupedStyles.set(key, [style]);
}

export const familyStyles = (product: Product) => groupedStyles.get(familyName(product))!;

const coverIds = new Set(["blue-kiftar", "mahogany-nezha"]);
export const productFamilies = Array.from(groupedStyles, ([label, styles]) => {
  const cover = styles.find(({ product }) => coverIds.has(product.id)) ?? styles[0];
  return { label, styles, ...cover };
});

export const heroFigures = productFamilies.map((family) => ({
  ...family, id: family.product.id, src: family.color.modelImage,
}));
export type HeroFigure = (typeof heroFigures)[number];

export const productHref = (p: Product, color?: ColorOption) =>
  `/product/${p.id}${color ? `?color=${encodeURIComponent(color.name)}` : ""}`;

export const formatPrice = (n: number | null) => n === null ? "Price on request" : `Rs ${n.toLocaleString("en-PK")}`;

/** Small (480px) version of a hanger photo, for thumbnails in the bag, checkout and galleries. */
export const thumbOf = (src: string) => src.includes("/shop/")
  ? src.replace(/\.webp$/, "-thumb.webp")
  : src.replace(/\/hangers\/([\w-]+)\.webp$/, "/hangers/$1-480.webp");
