const PUBLIC_API = "https://dummyjson.com";
const USD_TO_INR = 85; // approximate, used only to display DummyJSON prices in rupees
const $ = id => document.getElementById(id);

const toast = $("toast"), loader = $("loader"), cardGrid = $("cardGrid");
const resultInfo = $("resultInfo"), resultTitle = $("resultTitle");
const searchInput = $("searchInput"), limitSelect = $("limitSelect"), sortSelect = $("sortSelect");
const categoryList = $("categoryList"), localTable = $("localTable"), postForm = $("postForm");
const detail = $("detail"), detailBody = $("detailBody");

const state = { source: "local", category: "", q: "" };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const rupees = n => inr.format(Number(n) || 0);

const LOOK = {
  mobiles: [null, "#fbe7d0"], audio: ["\u{1F3A7}", "#fce4ec"], laptops: ["\u{1F4BB}", "#f5e6d3"],
  wearables: ["\u231A", "#fde2e4"], accessories: ["\u{1F50C}", "#fdf0c4"], home: ["\u{1F3E0}", "#ffe8d6"],
  fashion: ["\u{1F45F}", "#f7e1ef"], stationery: ["\u{1F4D3}", "#fbe9c6"]
};
const look = cat => LOOK[cat] || ["\u{1F6CD}\uFE0F", "#e5e7eb"];

/* ---------- helpers ---------- */
let toastTimer;
function showMessage(text, type) {
  toast.textContent = text;
  toast.className = "toast " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 5000);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showInspector(method, url, status, ms, sent, data) {
  $("inspectorMeta").textContent = `${method} ${url} | ${status} | ${ms} ms`;
  let text = "";
  if (sent !== undefined) text += "// Request body\n" + (typeof sent === "string" ? sent : JSON.stringify(sent, null, 2)) + "\n\n";
  text += "// Response\n" + (JSON.stringify(data, null, 2) || "(empty)");
  $("inspectorBody").textContent = text.length > 3000 ? text.slice(0, 3000) + "\n... (truncated)" : text;
}

/* Low-level call: only throws for network, timeout or invalid JSON. */
async function call(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const method = options.method || "GET";
  const config = { method, signal: controller.signal };
  if (options.body !== undefined) {
    config.headers = { "Content-Type": "application/json" };
    config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  const started = performance.now();
  try {
    const response = await fetch(url, config);
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; }
    catch { throw new Error("The server returned invalid JSON."); }
    const ms = Math.round(performance.now() - started);
    if (!options.quiet) showInspector(method, url, response.status, ms, options.body, data);
    return { ok: response.ok, status: response.status, data, ms };
  } catch (err) {
    if (err.name === "AbortError") throw new Error("The request timed out after 10 seconds. Try again.");
    if (err instanceof TypeError) throw new Error("Network error. Check your connection and that the server is running.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* High-level request: also throws on any non-2xx status. */
async function request(url, options) {
  const res = await call(url, options);
  if (!res.ok) throw new Error((res.data && res.data.message) || `Request failed with status ${res.status}.`);
  return res.data;
}

/* Turn either API's product into one common shape (price in rupees). */
function normalize(p, source) {
  return {
    id: p.id,
    title: p.title || "Untitled",
    category: p.category || "general",
    price: source === "public" ? Number(p.price || 0) * USD_TO_INR : Number(p.price || 0),
    stock: p.stock,
    description: p.description || "",
    brand: p.brand || "",
    thumbnail: source === "public" && typeof p.thumbnail === "string" && p.thumbnail.startsWith("https://") ? p.thumbnail : ""
  };
}

function phoneIcon() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("aria-hidden", "true");
  const add = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    svg.append(n);
  };
  add("rect", { x: 13, y: 4, width: 22, height: 40, rx: 5, fill: "#7a1f3d" });
  add("rect", { x: 16, y: 9, width: 16, height: 28, rx: 2, fill: "#fbe7d0" });
  add("circle", { cx: 24, cy: 40.5, r: 1.8, fill: "#f2a900" });
  return svg;
}

function tile(p) {
  const box = el("div", "tile");
  if (p.thumbnail) {
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = p.thumbnail;
    box.append(img);
  } else {
    const [emoji, color] = look(p.category);
    box.style.background = color;
    if (emoji === null) box.append(phoneIcon());
    else box.textContent = emoji;
  }
  return box;
}

function stockLabel(stock) {
  if (stock === undefined || stock === null) return el("div", "stock");
  if (stock === 0) return el("div", "stock out", "Out of stock");
  if (stock <= 20) return el("div", "stock low", "Only " + stock + " left");
  return el("div", "stock in", "In stock");
}

/* ---------- shop ---------- */
function productUrl(id) {
  return state.source === "public" ? `${PUBLIC_API}/products/${encodeURIComponent(id)}` : `/api/local/products/${encodeURIComponent(id)}`;
}

function renderCards(products) {
  cardGrid.replaceChildren();
  if (!products.length) {
    cardGrid.append(el("p", "empty", "No products found. Try a different search or category."));
    return;
  }
  products.forEach(p => {
    const card = el("button", "product");
    card.type = "button";
    card.setAttribute("aria-label", `${p.title}, ${rupees(p.price)}. View details`);
    const body = el("div", "pbody");
    body.append(el("div", "pcat", p.category.replace(/-/g, " ")), el("h3", "pname", p.title), stockLabel(p.stock), el("div", "price", rupees(p.price)));
    card.append(tile(p), body);
    card.addEventListener("click", () => openDetail(productUrl(p.id), state.source));
    cardGrid.append(card);
  });
}

async function openDetail(url, source) {
  try {
    const raw = await request(url);
    if (!raw || typeof raw !== "object" || raw.id === undefined) throw new Error("Unexpected product format.");
    const p = normalize(raw, source);
    detailBody.replaceChildren();
    const body = el("div", "dbody");
    body.append(
      el("div", "pcat", p.category.replace(/-/g, " ")),
      el("h3", "", p.title),
      el("div", "price", rupees(p.price)),
      el("p", "", p.description || "No description."),
      el("p", "pcat", `Product ID ${p.id}` + (p.brand ? " | " + p.brand : "")),
      stockLabel(p.stock)
    );
    detailBody.append(tile(p), body);
    detail.showModal();
  } catch (err) {
    showMessage("Could not load product: " + err.message, "error");
  }
}

function buildCategoryButton(slug, name, count) {
  const b = el("button", "cat" + (state.category === slug ? " active" : ""));
  b.type = "button";
  b.append(el("span", "", name));
  if (count !== undefined) b.append(el("small", "", String(count)));
  b.addEventListener("click", () => {
    state.category = slug;
    state.q = "";
    searchInput.value = "";
    markCategory();
    loadProducts();
  });
  b.dataset.slug = slug;
  return b;
}

function markCategory() {
  categoryList.querySelectorAll(".cat").forEach(b => b.classList.toggle("active", b.dataset.slug === state.category));
}

async function loadCategories() {
  categoryList.replaceChildren();
  try {
    const url = state.source === "public" ? PUBLIC_API + "/products/categories" : "/api/local/categories";
    const list = await request(url);
    if (!Array.isArray(list)) throw new Error("Unexpected categories response.");
    categoryList.append(buildCategoryButton("", "All products"));
    list.forEach(item => {
      const slug = typeof item === "string" ? item : item.slug;
      const name = typeof item === "string" ? item : item.name;
      categoryList.append(buildCategoryButton(slug, name, item.count));
    });
  } catch (err) {
    showMessage("Could not load categories: " + err.message, "error");
  }
}

async function loadProducts() {
  const limit = limitSelect.value;
  const base = state.source === "public" ? PUBLIC_API : "/api/local";
  const q = encodeURIComponent(state.q);
  let url;
  if (state.source === "public") {
    if (state.q) url = `${base}/products/search?q=${q}&limit=${limit}`;
    else if (state.category) url = `${base}/products/category/${encodeURIComponent(state.category)}?limit=${limit}`;
    else url = `${base}/products?limit=${limit}`;
  } else {
    const params = new URLSearchParams({ limit });
    if (state.q) params.set("q", state.q);
    if (state.category) params.set("category", state.category);
    url = `${base}/products?${params}`;
  }

  loader.classList.remove("hidden");
  cardGrid.replaceChildren();
  resultInfo.textContent = "";
  resultTitle.textContent = state.q ? `Results for "${state.q}"` : state.category ? state.category.replace(/-/g, " ") : "All products";
  try {
    const data = await request(url);
    if (!data || !Array.isArray(data.products)) throw new Error("Unexpected response format from the API.");
    let list = data.products.map(p => normalize(p, state.source));
    if (sortSelect.value === "low") list.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "high") list.sort((a, b) => b.price - a.price);
    renderCards(list);
    resultInfo.textContent = `Showing ${list.length} of ${data.total} products`;
  } catch (err) {
    showMessage("Could not load products: " + err.message, "error");
  } finally {
    loader.classList.add("hidden");
  }
}

/* ---------- catalog table (add view) ---------- */
function renderLocal(products) {
  localTable.replaceChildren();
  if (!products.length) {
    const cell = localTable.insertRow().insertCell();
    cell.colSpan = 5;
    cell.className = "empty";
    cell.textContent = "No products found. Add one with the form.";
    return;
  }
  products.forEach(p => {
    const row = localTable.insertRow();
    row.tabIndex = 0;
    [p.id, p.title, p.category, rupees(p.price), p.stock].forEach((v, i) => {
      const cell = row.insertCell();
      cell.textContent = v;
      if (i >= 3) cell.className = "num";
    });
    const open = () => openDetail("/api/local/products/" + encodeURIComponent(p.id), "local");
    row.addEventListener("click", open);
    row.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
  });
}

async function loadLocal() {
  const q = $("localSearch").value.trim();
  try {
    const data = await request("/api/local/products" + (q ? "?q=" + encodeURIComponent(q) : ""));
    if (!data || !Array.isArray(data.products)) throw new Error("Unexpected response format from the local API.");
    renderLocal(data.products);
  } catch (err) {
    showMessage("Could not load the catalog: " + err.message, "error");
  }
}

/* ---------- POST form ---------- */
function formBody() {
  return {
    title: $("title").value.trim(),
    category: $("category").value.trim(),
    price: $("price").value,
    stock: $("stock").value,
    description: $("description").value.trim()
  };
}

function checkForm(b) {
  if (b.title.length < 2) return "Enter a product name of at least 2 characters.";
  if (b.category.length < 2) return "Enter a category of at least 2 characters.";
  if (b.price === "" || Number(b.price) < 0) return "Enter a price of 0 or more.";
  if (b.stock === "" || !Number.isInteger(Number(b.stock)) || Number(b.stock) < 0) return "Enter stock as a whole number, 0 or more.";
  return "";
}

postForm.addEventListener("submit", async event => {
  event.preventDefault();
  const body = formBody();
  const problem = checkForm(body);
  if (problem) return showMessage(problem, "error");

  const target = postForm.elements["target"].value;
  const url = target === "local" ? "/api/local/products" : PUBLIC_API + "/products/add";
  const btn = $("submitBtn");
  btn.disabled = true;
  try {
    const data = await request(url, { method: "POST", body });
    if (target === "local") {
      if (!data || !data.product) throw new Error("Unexpected response format from the server.");
      showMessage(`Added "${data.product.title}" with ID ${data.product.id}.`, "success");
      loadLocal();
      if (state.source === "local") { loadCategories(); loadProducts(); }
    } else {
      if (!data || data.id === undefined) throw new Error("Unexpected response format from DummyJSON.");
      showMessage(`DummyJSON accepted "${data.title}" (simulated ID ${data.id}). It is not stored.`, "success");
    }
    postForm.reset();
  } catch (err) {
    showMessage("Could not send product: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

/* ---------- endpoint tests ---------- */
const sample = { title: "Test Lamp", category: "Home", price: 899.5, stock: 7, description: "Desk lamp." };
const tests = [
  { name: "Public: list products", req: "GET /products?limit=5",
    run: () => call(PUBLIC_API + "/products?limit=5", { quiet: true }),
    check: r => r.ok && Array.isArray(r.data.products) && r.data.products.length === 5 && "title" in r.data.products[0] && "price" in r.data.products[0] },
  { name: "Public: search", req: "GET /products/search?q=phone",
    run: () => call(PUBLIC_API + "/products/search?q=phone", { quiet: true }),
    check: r => r.ok && Array.isArray(r.data.products) && r.data.products.length > 0 },
  { name: "Public: categories", req: "GET /products/categories",
    run: () => call(PUBLIC_API + "/products/categories", { quiet: true }),
    check: r => r.ok && Array.isArray(r.data) && r.data.length > 0 },
  { name: "Public: one category", req: "GET /products/category/laptops",
    run: () => call(PUBLIC_API + "/products/category/laptops", { quiet: true }),
    check: r => r.ok && r.data.products.length > 0 && r.data.products.every(p => p.category === "laptops") },
  { name: "Public: POST echoes data", req: "POST /products/add",
    run: () => call(PUBLIC_API + "/products/add", { method: "POST", body: sample, quiet: true }),
    check: r => r.status === 201 && r.data.title === sample.title && r.data.id !== undefined },
  { name: "QuickShop: list products", req: "GET /api/local/products",
    run: () => call("/api/local/products", { quiet: true }),
    check: r => r.ok && Array.isArray(r.data.products) && r.data.total >= r.data.products.length },
  { name: "QuickShop: filter by category", req: "GET /api/local/products?category=audio",
    run: () => call("/api/local/products?category=audio", { quiet: true }),
    check: r => r.ok && r.data.products.length > 0 && r.data.products.every(p => p.category === "audio") },
  { name: "QuickShop: categories", req: "GET /api/local/categories",
    run: () => call("/api/local/categories", { quiet: true }),
    check: r => r.ok && Array.isArray(r.data) && r.data.every(c => c.slug && c.count > 0) },
  { name: "QuickShop: missing product gives 404", req: "GET /api/local/products/99999",
    run: () => call("/api/local/products/99999", { quiet: true }),
    check: r => r.status === 404 && typeof r.data.message === "string" },
  { name: "QuickShop: invalid POST gives 400", req: "POST /api/local/products",
    run: () => call("/api/local/products", { method: "POST", body: { title: "x", category: "", price: -5, stock: 1.5 }, quiet: true }),
    check: r => r.status === 400 && typeof r.data.message === "string" },
  { name: "QuickShop: malformed JSON gives 400", req: "POST /api/local/products (bad JSON)",
    run: () => call("/api/local/products", { method: "POST", body: "{not json", quiet: true }),
    check: r => r.status === 400 },
  { name: "QuickShop: POST then read back", req: "POST then GET by ID",
    run: async () => {
      const post = await call("/api/local/products", { method: "POST", body: sample, quiet: true });
      if (post.status !== 201) return post;
      const get = await call("/api/local/products/" + post.data.product.id, { quiet: true });
      return { ...get, status: post.status + " / " + get.status };
    },
    check: r => r.ok && r.data.title === sample.title && r.data.category === "home" && r.data.price === sample.price && r.data.stock === sample.stock }
];

$("runTests").addEventListener("click", async () => {
  const btn = $("runTests"), body = $("testTable");
  btn.disabled = true;
  body.replaceChildren();
  $("testSummary").textContent = "Running...";
  let passed = 0;
  for (const t of tests) {
    const row = body.insertRow();
    let ok = false, status = "-", note = "";
    try {
      const r = await t.run();
      status = r.status;
      ok = Boolean(t.check(r));
      note = ok ? `${r.ms ?? ""} ms` : "Unexpected response: " + JSON.stringify(r.data).slice(0, 80);
    } catch (err) {
      note = err.message;
    }
    if (ok) passed++;
    row.insertCell().append(el("span", ok ? "pass" : "fail", ok ? "Pass" : "Fail"));
    row.insertCell().textContent = t.name;
    row.insertCell().append(el("code", "", t.req));
    row.insertCell().textContent = status;
    row.insertCell().textContent = note;
  }
  $("testSummary").textContent = `${passed} of ${tests.length} tests passed.`;
  showMessage(passed === tests.length ? "All endpoint tests passed." : `${tests.length - passed} test(s) failed. See the table.`, passed === tests.length ? "success" : "error");
  btn.disabled = false;
  loadLocal();
});

/* ---------- documentation table ---------- */
const docs = [
  ["GET", "https://dummyjson.com/products?limit=12", "List products", "None", "{ products: [...], total, skip, limit }"],
  ["GET", "https://dummyjson.com/products/search?q=phone", "Search products", "None", "Same as list"],
  ["GET", "https://dummyjson.com/products/categories", "List categories", "None", "[ { slug, name, url } ]"],
  ["GET", "https://dummyjson.com/products/category/{slug}", "Products in a category", "None", "Same as list"],
  ["GET", "https://dummyjson.com/products/{id}", "One product", "None", "Product object"],
  ["POST", "https://dummyjson.com/products/add", "Add product (simulated)", "{ title, category, price, stock, description }", "{ id, title, ... }"],
  ["GET", "/api/local/products?q=&category=&limit=", "List catalog products", "None", "{ total, products: [...] }"],
  ["GET", "/api/local/categories", "List catalog categories", "None", "[ { slug, name, count } ]"],
  ["GET", "/api/local/products/:id", "One catalog product", "None", "Product object, or 404 { message }"],
  ["POST", "/api/local/products", "Add catalog product", "{ title, category, price, stock, description }", "201 { message, product } or 400 { message }"]
];
docs.forEach(row => {
  const tr = $("docsTable").insertRow();
  row.forEach((value, i) => {
    const cell = tr.insertCell();
    if (i === 0) cell.append(el("span", "verb " + value.toLowerCase(), value));
    else if (i === 1 || i >= 3) cell.append(el("code", "", value));
    else cell.textContent = value;
  });
});

/* ---------- UI wiring ---------- */
function showView(id) {
  document.querySelectorAll(".navbtn").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("hidden", v.id !== id));
}
document.querySelectorAll(".navbtn").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));

$("brand").addEventListener("click", e => {
  e.preventDefault();
  state.q = ""; state.category = ""; searchInput.value = "";
  showView("shopView");
  markCategory();
  loadProducts();
});

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  state.q = searchInput.value.trim();
  state.category = "";
  markCategory();
  showView("shopView");
  loadProducts();
});

document.querySelectorAll('input[name="source"]').forEach(r => r.addEventListener("change", () => {
  state.source = r.value;
  state.category = "";
  state.q = "";
  searchInput.value = "";
  loadCategories();
  loadProducts();
}));

sortSelect.addEventListener("change", loadProducts);
limitSelect.addEventListener("change", loadProducts);
$("detailClose").addEventListener("click", () => detail.close());
detail.addEventListener("click", e => { if (e.target === detail) detail.close(); });
$("localBtn").addEventListener("click", loadLocal);
$("localSearch").addEventListener("keydown", e => { if (e.key === "Enter") loadLocal(); });

loadCategories();
loadProducts();
loadLocal();