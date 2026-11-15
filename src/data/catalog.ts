/**
 * Ghanam Rang catalog.
 *
 * Built from the product photos and size charts the owner shared.
 * PRICES ARE PLACEHOLDERS — replace them with the real prices.
 * The size-chart-to-product pairing is a best guess (longer chart → abaya set).
 */

export type Category = "abaya-sets" | "khimar-sets";

export const categories: { id: Category; label: string }[] = [
  { id: "abaya-sets", label: "Abaya Sets" },
  { id: "khimar-sets", label: "Khimar Sets" },
];

export type ColorOption = {
  name: string;
  swatch: string;
  /** Garment photographed on a hanger for The Rail. */
  railImage: string;
  /** Images shown across shop and product views. */
  images: string[];
};

export type SizeChart = { unit: string; head: string[]; rows: string[][] };

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  colors: ColorOption[];
  sizes: string[];
  sizeChart: SizeChart;
  pieces: string[];
  description: string;
  details: string[];
  isNew: boolean;
};

const SIZES = ["S", "M", "L"];

export const products: Product[] = [
  {
    id: "open-abaya-set",
    name: "Open Abaya Set",
    category: "abaya-sets",
    price: 7500, // placeholder
    colors: [{ name: "Mocha", swatch: "#69423a", railImage: "/products/hangers/mocha.webp", images: ["/products/hangers/mocha.webp"] }],
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
        swatch: "#48566b",
        railImage: "/products/hangers/navy.webp",
        images: ["/products/hangers/navy.webp"],
      },
      { name: "Olive", swatch: "#2f3a2f", railImage: "/products/hangers/olive.webp", images: ["/products/hangers/olive.webp"] },
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
];

/** One entry per photographed outfit, used by the Try the Style carousel. */
export type Look = { id: string; title: string; productId: string; colorName: string; image: string };

export const looks: Look[] = [
  { id: "olive", title: "Olive Khimar", productId: "khimar-set", colorName: "Olive", image: "/products/hangers/olive.webp" },
  { id: "navy-walk", title: "Navy Khimar", productId: "khimar-set", colorName: "Navy", image: "/products/hangers/navy.webp" },
  { id: "mocha", title: "Mocha Abaya", productId: "open-abaya-set", colorName: "Mocha", image: "/products/hangers/mocha.webp" },
];

/**
 * Figures for the homepage hero: the model photos, cut out of their black
 * background (transparent WebP). Order = starting order in the floating cluster.
 * (The rest of the site uses the hanger photos.)
 */
export type HeroFigure = { id: string; productId: string; colorName: string; src: string; word: string };

export const heroFigures: HeroFigure[] = [
  { id: "navy", productId: "khimar-set", colorName: "Navy", src: "/products/cutouts/navy.webp", word: "Khimar" },
  { id: "mocha", productId: "open-abaya-set", colorName: "Mocha", src: "/products/cutouts/mocha.webp", word: "Abaya" },
  { id: "navy-ball", productId: "khimar-set", colorName: "Navy", src: "/products/cutouts/navy-ball.webp", word: "Khimar" },
  { id: "olive", productId: "khimar-set", colorName: "Olive", src: "/products/cutouts/olive.webp", word: "Khimar" },
];

const byId = new Map(products.map((p) => [p.id, p]));
export const getProduct = (id: string) => byId.get(id);

export const findColor = (p: Product, name?: string | null) => p.colors.find((c) => c.name === name) ?? p.colors[0];

/** Every product/colour pair, for grids that show each colourway as its own card. */
export const colorways = products.flatMap((product) => product.colors.map((color) => ({ product, color })));

export const productHref = (p: Product, color?: ColorOption) =>
  `/product/${p.id}${color ? `?color=${encodeURIComponent(color.name)}` : ""}`;

export const formatPrice = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

/** Small (480px) version of a hanger photo, for thumbnails in the bag, checkout and galleries. */
export const thumbOf = (src: string) => src.replace(/\/hangers\/([\w-]+)\.webp$/, "/hangers/$1-480.webp");
