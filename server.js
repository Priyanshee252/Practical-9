const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const seed = [
  ["Redmi Note 13 5G", "mobiles", 17999, 40, "6.67 inch AMOLED display, 108 MP camera, 5000 mAh battery."],
  ["Samsung Galaxy M35", "mobiles", 19999, 32, "6000 mAh battery, 120 Hz Super AMOLED screen."],
  ["Realme Narzo 70x", "mobiles", 11999, 60, "Everyday 5G phone with 45W fast charging."],
  ["boAt Airdopes 141", "audio", 1299, 120, "True wireless earbuds with 42 hours of playback."],
  ["JBL Go 3 Speaker", "audio", 2999, 45, "Pocket-size waterproof Bluetooth speaker."],
  ["Sony WH-CH520 Headphones", "audio", 4490, 28, "Wireless on-ear headphones, 50 hours of battery."],
  ["HP 15s Laptop", "laptops", 42990, 14, "Intel Core i5, 16 GB RAM, 512 GB SSD, 15.6 inch display."],
  ["Lenovo IdeaPad Slim 3", "laptops", 36990, 18, "Ryzen 5, 8 GB RAM, 512 GB SSD, thin and light."],
  ["Apple iPad 10th Gen", "laptops", 33900, 12, "10.9 inch Liquid Retina display, 64 GB."],
  ["Noise ColorFit Pro 5", "wearables", 3999, 50, "1.85 inch AMOLED smartwatch with Bluetooth calling."],
  ["Mi Smart Band 8", "wearables", 2499, 70, "Fitness band with 16 day battery and SpO2 tracking."],
  ["Fire-Boltt Ninja Call", "wearables", 1799, 90, "Budget smartwatch with 120 sports modes."],
  ["Logitech M235 Wireless Mouse", "accessories", 699, 150, "Compact 2.4 GHz wireless mouse."],
  ["Ambrane 20000 mAh Power Bank", "accessories", 1899, 80, "Dual-port fast-charging power bank."],
  ["Mi 33W Wall Charger", "accessories", 899, 200, "SonicCharge 33W USB-A fast charger."],
  ["Philips Air Fryer HD9200", "home", 6995, 22, "4.1 litre air fryer, 1400W, rapid air technology."],
  ["Prestige Induction Cooktop", "home", 2299, 35, "2000W induction cooktop with preset menus."],
  ["Milton Thermosteel Bottle 1L", "home", 799, 110, "Keeps drinks hot or cold for up to 24 hours."],
  ["Wakefit Orthopedic Pillow", "home", 999, 65, "Memory foam pillow for neck support."],
  ["Puma Men's Running Shoes", "fashion", 2799, 48, "Lightweight mesh shoes with cushioned sole."],
  ["Levi's 511 Slim Jeans", "fashion", 2199, 55, "Slim-fit stretch denim jeans."],
  ["Fastrack Analog Watch", "fashion", 1495, 42, "Everyday analog watch with 3 ATM water resistance."],
  ["Skybags Backpack 30L", "fashion", 1299, 75, "Water-resistant backpack with laptop sleeve."],
  ["Classmate Notebook Pack of 6", "stationery", 399, 300, "Single-line notebooks, 172 pages each."],
  ["OnePlus Nord CE4", "mobiles", 24999, 26, "6.7 inch AMOLED, Snapdragon 7 Gen 3, 100W fast charging."],
  ["Vivo T3 5G", "mobiles", 17999, 38, "6.67 inch AMOLED, 50 MP Sony camera, 5000 mAh battery."],
  ["iQOO Z9x 5G", "mobiles", 12999, 52, "Snapdragon 6 Gen 1, 6000 mAh battery, 120 Hz display."],
  ["Poco M6 Pro", "mobiles", 9999, 70, "6.79 inch FHD+ display, 50 MP camera, 5G."],
  ["Sennheiser CX 80S Earphones", "audio", 1190, 85, "Wired in-ear earphones with remote and mic."],
  ["Zebronics Zeb-Juke Soundbar", "audio", 3499, 30, "Bluetooth soundbar with 80W output and remote."],
  ["Acer Aspire Lite", "laptops", 31990, 16, "Intel Core i3, 8 GB RAM, 512 GB SSD, 15.6 inch display."],
  ["ASUS Vivobook 15", "laptops", 44990, 11, "Intel Core i5, 16 GB RAM, 512 GB SSD, backlit keyboard."],
  ["Dell Inspiron 3530", "laptops", 47990, 9, "Core i5 13th Gen, 16 GB RAM, 1 TB storage."],
  ["Samsung Galaxy Tab A9+", "laptops", 17999, 20, "11 inch tablet with quad speakers, 64 GB."],
  ["Amazfit Bip 5", "wearables", 6999, 34, "1.91 inch display smartwatch with built-in GPS."],
  ["boAt Wave Call 3", "wearables", 1999, 85, "1.83 inch smartwatch with Bluetooth calling."],
  ["Zebronics Gaming Keyboard", "accessories", 1299, 60, "Backlit membrane keyboard with 104 keys."],
  ["SanDisk 128 GB Pen Drive", "accessories", 849, 180, "USB 3.0 flash drive, 150 MB/s read speed."],
  ["TP-Link Wi-Fi Router AX1500", "accessories", 2699, 38, "Dual-band Wi-Fi 6 router with 4 antennas."],
  ["Havells Mixer Grinder 750W", "home", 3599, 27, "3 stainless steel jars, 750W motor."],
  ["Pigeon Non-Stick Cookware Set", "home", 1799, 40, "3-piece set with kadhai, tawa and fry pan."],
  ["Bombay Dyeing Bedsheet", "home", 899, 70, "Double bedsheet in soft cotton with two pillow covers."],
  ["Wildcraft Rain Jacket", "fashion", 1999, 30, "Lightweight waterproof jacket with hood."],
  ["Allen Solly Formal Shirt", "fashion", 1299, 58, "Regular fit cotton formal shirt."],
  ["Ray-Ban Wayfarer Sunglasses", "fashion", 6490, 15, "Classic UV-protected sunglasses."],
  ["Parker Vector Pen", "stationery", 249, 130, "Stainless steel body ball pen, blue ink."],
  ["Faber-Castell Colour Pencils 48", "stationery", 749, 85, "48 shades in a sturdy tin box."],
  ["Casio FX-991EX Calculator", "stationery", 1295, 45, "Scientific calculator with 552 functions."]
];
let nextId = seed.length + 1;
const products = seed.map(([title, category, price, stock, description], i) => ({ id: i + 1, title, category, price, stock, description }));

function clean(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

function validate(body) {
  const errors = [];
  const p = {
    title: clean(body.title),
    category: clean(body.category).toLowerCase(),
    price: body.price === "" || body.price === null ? NaN : Number(body.price),
    stock: body.stock === "" || body.stock === null ? NaN : Number(body.stock),
    description: clean(body.description)
  };
  if (p.title.length < 2 || p.title.length > 100) errors.push("Title must be 2-100 characters.");
  if (p.category.length < 2 || p.category.length > 50) errors.push("Category must be 2-50 characters.");
  if (!Number.isFinite(p.price) || p.price < 0 || p.price > 10000000) errors.push("Price must be a number of 0 or more.");
  if (!Number.isInteger(p.stock) || p.stock < 0 || p.stock > 1000000) errors.push("Stock must be a whole number of 0 or more.");
  if (p.description.length > 300) errors.push("Description must be 300 characters or fewer.");
  return { errors, p };
}

// GET /api/local/products?q=&category=&limit=
app.get("/api/local/products", (req, res) => {
  const q = clean(req.query.q).toLowerCase();
  const category = clean(req.query.category).toLowerCase();
  let list = products;
  if (q) list = list.filter(p => p.title.toLowerCase().includes(q));
  if (category) list = list.filter(p => p.category === category);
  const total = list.length;
  const limit = parseInt(req.query.limit, 10);
  if (limit > 0) list = list.slice(0, limit);
  res.json({ total, products: list });
});

// GET /api/local/categories
app.get("/api/local/categories", (req, res) => {
  const counts = {};
  products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  res.json(Object.keys(counts).sort().map(slug => ({ slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), count: counts[slug] })));
});

// GET /api/local/products/:id
app.get("/api/local/products/:id", (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json(product);
});

// POST /api/local/products
app.post("/api/local/products", (req, res) => {
  const { errors, p } = validate(req.body || {});
  if (errors.length) return res.status(400).json({ message: errors.join(" ") });
  const product = { id: nextId++, ...p };
  products.unshift(product);
  res.status(201).json({ message: "Product added successfully.", product });
});

app.use("/api", (req, res) => res.status(404).json({ message: "API endpoint not found." }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON in request body." });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body is too large." });
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => console.log("QuickShop running at http://localhost:" + PORT));