/* PRODUCT_FEED: 1688.com mock ingestion layer */
export type FreightClass =
  | "Normal Goods"
  | "Battery Goods"
  | "Powder/Liquid Goods"
  | "Special Goods";

export interface Product1688 {
  id: string;
  title: string;
  image: string;
  vendor: string;
  pricePerUnitCNY: number; // native ¥ RMB price
  moq: number;             // minimum order quantity
  freightClass: FreightClass;
  unit: string;            // piece, set, pair...
}

/* Stable deterministic placeholder imagery via picsum */
const img = (seed: number) =>
  `https://picsum.photos/seed/ngh-${seed}/600/600`;

export const PRODUCT_FEED: Product1688[] = [
  { id: "1688-001", title: "Wireless Bluetooth Earbuds Pro X12", vendor: "Shenzhen Anke Tech", image: img(101), pricePerUnitCNY: 38.5,  moq: 10, freightClass: "Battery Goods",      unit: "piece" },
  { id: "1688-002", title: "Stainless Steel Insulated Bottle 750ml", vendor: "Yongkang Boya",  image: img(102), pricePerUnitCNY: 22.0,  moq: 20, freightClass: "Normal Goods",       unit: "piece" },
  { id: "1688-003", title: "Mini Portable Power Bank 10000mAh", vendor: "Guangzhou Powerline", image: img(103), pricePerUnitCNY: 54.9,  moq: 5,  freightClass: "Battery Goods",      unit: "piece" },
  { id: "1688-004", title: "Premium Matte Liquid Lipstick Set", vendor: "Yiwu Beauty Trade",  image: img(104), pricePerUnitCNY: 12.8,  moq: 30, freightClass: "Powder/Liquid Goods",unit: "set"   },
  { id: "1688-005", title: "Foldable Phone Stand Aluminum",     vendor: "Dongguan Mech",      image: img(105), pricePerUnitCNY: 9.50,  moq: 50, freightClass: "Normal Goods",       unit: "piece" },
  { id: "1688-006", title: "Smart LED Strip Lights 5m RGB",     vendor: "Shenzhen LumiCo",    image: img(106), pricePerUnitCNY: 28.0,  moq: 10, freightClass: "Normal Goods",       unit: "roll"  },
  { id: "1688-007", title: "Industrial Hand Drill 600W",        vendor: "Jinhua Tools",       image: img(107), pricePerUnitCNY: 145.0, moq: 2,  freightClass: "Special Goods",      unit: "piece" },
  { id: "1688-008", title: "Premium Korean Skincare Serum",     vendor: "Guangzhou Glow",     image: img(108), pricePerUnitCNY: 33.0,  moq: 12, freightClass: "Powder/Liquid Goods",unit: "bottle"},
  { id: "1688-009", title: "Bluetooth Mechanical Keyboard 75%", vendor: "Suzhou Keyworks",    image: img(109), pricePerUnitCNY: 188.0, moq: 3,  freightClass: "Battery Goods",      unit: "piece" },
  { id: "1688-010", title: "Cotton Unisex Oversize T-Shirt",    vendor: "Hangzhou Apparel",   image: img(110), pricePerUnitCNY: 14.0,  moq: 50, freightClass: "Normal Goods",       unit: "piece" },
  { id: "1688-011", title: "Car Engine Oil 5W-30 Synthetic 4L", vendor: "Qingdao Lube",       image: img(111), pricePerUnitCNY: 98.0,  moq: 6,  freightClass: "Powder/Liquid Goods",unit: "drum"  },
  { id: "1688-012", title: "Industrial Safety Boots Steel Toe", vendor: "Wenzhou Safety",     image: img(112), pricePerUnitCNY: 76.0,  moq: 10, freightClass: "Normal Goods",       unit: "pair"  },
  { id: "1688-013", title: "Solar Panel 100W Mono Crystalline", vendor: "Hefei Solartek",     image: img(113), pricePerUnitCNY: 320.0, moq: 1,  freightClass: "Special Goods",      unit: "panel" },
  { id: "1688-014", title: "Cosmetic Face Powder Compact Box",  vendor: "Yiwu Lush",          image: img(114), pricePerUnitCNY: 8.90,  moq: 100,freightClass: "Powder/Liquid Goods",unit: "piece" },
  { id: "1688-015", title: "Hair Clipper Cordless Pro",         vendor: "Foshan Grooming",    image: img(115), pricePerUnitCNY: 64.0,  moq: 5,  freightClass: "Battery Goods",      unit: "piece" },
  { id: "1688-016", title: "Yoga Mat Non-Slip 6mm TPE",         vendor: "Ningbo Active",      image: img(116), pricePerUnitCNY: 41.0,  moq: 10, freightClass: "Normal Goods",       unit: "piece" },
  { id: "1688-017", title: "Hand Sanitizer Gel 500ml Bulk",     vendor: "Shanghai Hygiene",   image: img(117), pricePerUnitCNY: 18.5,  moq: 24, freightClass: "Powder/Liquid Goods",unit: "bottle"},
  { id: "1688-018", title: "Drone Battery 4S 5200mAh LiPo",     vendor: "Shenzhen DroneCo",   image: img(118), pricePerUnitCNY: 210.0, moq: 1,  freightClass: "Battery Goods",      unit: "pack"  },
  { id: "1688-019", title: "Office Ergonomic Mesh Chair",       vendor: "Foshan Furnix",      image: img(119), pricePerUnitCNY: 540.0, moq: 1,  freightClass: "Special Goods",      unit: "piece" },
  { id: "1688-020", title: "Premium Coffee Beans Arabica 1kg",  vendor: "Kunming Roast",      image: img(120), pricePerUnitCNY: 88.0,  moq: 5,  freightClass: "Normal Goods",       unit: "bag"   },
  { id: "1688-021", title: "Resistance Bands Set of 5",         vendor: "Ningbo Active",      image: img(121), pricePerUnitCNY: 22.5,  moq: 20, freightClass: "Normal Goods",       unit: "set"   },
  { id: "1688-022", title: "Acrylic Paint Set 24 Colors",       vendor: "Hangzhou Artique",   image: img(122), pricePerUnitCNY: 35.0,  moq: 10, freightClass: "Powder/Liquid Goods",unit: "set"   },
  { id: "1688-023", title: "Smart Watch Fitness Tracker S9",    vendor: "Shenzhen Wearables", image: img(123), pricePerUnitCNY: 95.0,  moq: 5,  freightClass: "Battery Goods",      unit: "piece" },
  { id: "1688-024", title: "Heavy Duty Cordless Impact Wrench", vendor: "Jinhua Tools",       image: img(124), pricePerUnitCNY: 410.0, moq: 1,  freightClass: "Special Goods",      unit: "piece" },
];

export const FREIGHT_CLASS_COLOR: Record<FreightClass, string> = {
  "Normal Goods":         "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Battery Goods":        "bg-amber-50 text-amber-700 border-amber-200",
  "Powder/Liquid Goods":  "bg-sky-50 text-sky-700 border-sky-200",
  "Special Goods":        "bg-rose-50 text-rose-700 border-rose-200",
};
