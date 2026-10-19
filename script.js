/* ===== PENGATURAN ===== */
const JUDUL = "jemsi Pictures";
const DESKRIPSI = "a long year ago";
const PENUTUP = "";   // kosongkan "" jika tidak ingin ada kalimat penutup

/* ===== UNGGAH FOTO OLEH PENGUNJUNG (Cloudinary) =====
   Isi kedua baris ini setelah membuat akun gratis di cloudinary.com:
   - CLOUD_NAME   : nama cloud di Dashboard
   - UPLOAD_PRESET: nama upload preset (mode Unsigned) yang kamu buat
   Kosongkan keduanya jika tidak ingin ada fitur unggah. */
const CLOUD_NAME = "gqrcyl44";
const UPLOAD_PRESET = "jemsss";
const TAG = "galeri";
/* ====================== */

const $ = id => document.getElementById(id);
$("judul").textContent = JUDUL; $("desk").textContent = DESKRIPSI; document.title = JUDUL;
$("foot").textContent = PENUTUP; $("foot").hidden = !PENUTUP;

const CL = !!(CLOUD_NAME && UPLOAD_PRESET);
const enc = p => p.split("/").map(encodeURIComponent).join("/");
const cl = (r, tr) => `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${tr ? tr + "/" : ""}v${r.version}/${r.public_id}.${r.format}`;

/* penyimpanan kecil di browser untuk token hapus (berlaku 10 menit) dan daftar foto yang sudah dihapus */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const TOKENS = store.get("galeri-tokens", {});            // {public_id: {t: token, e: waktu kedaluwarsa}}
Object.keys(TOKENS).forEach(k => { if (TOKENS[k].e < Date.now()) delete TOKENS[k]; });
store.set("galeri-tokens", TOKENS);
const GONE = new Set(store.get("galeri-gone", []));
const canDel = p => !!p.own || !!(p.pid && p.tok && p.exp > Date.now());

const fromCloud = r => {
  const k = TOKENS[r.public_id];
  return {f: r.public_id.split("/").pop() + "." + r.format, t: "", w: r.width || 4, h: r.height || 3,
    u: cl(r, "c_limit,w_2000,q_auto"), th: cl(r, "c_limit,w_700,q_auto,f_auto"), d: cl(r, "fl_attachment"), ts: Date.parse(r.created_at) || 0,
    pid: r.public_id, tok: k && k.t, exp: k ? k.e : 0};
};

let LOCAL = (window.FOTO || []).map(p => ({...p, u: "foto/" + enc(p.f), th: "thumb/" + enc(p.f), ts: 0,
  t: p.t ?? p.f.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), w: p.w || 4, h: p.h || 3}));
let CLOUDS = [], ALL = [], ready = !CL;
const demo = !LOCAL.length && !CL;
if (demo) {
  LOCAL = Array.from({length: 30}, (_, i) => {
    const w = 800, h = [533, 800, 1000, 600][i % 4], hue = (i * 37) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,66%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},60%,40%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    const u = "data:image/svg+xml," + encodeURIComponent(svg);
    return {f: "contoh-" + (i + 1) + ".svg", t: "Contoh " + (i + 1), w, h, u, th: u, ts: 0};
  });
  $("note").hidden = false;
}
$("fab").hidden = !(CL || demo);

function refresh(newStrip) {
  ALL = [...CLOUDS].sort((a, b) => b.ts - a.ts).concat(LOCAL);
  $("empty").hidden = ALL.length > 0 || !ready;
  if (newStrip) strip();
  layout();
}
function strip() {
  const s = $("strip"); s.innerHTML = "";
  [...ALL].sort(() => Math.random() - .5).slice(0, 5).forEach(p => {
    const i = new Image(); i.alt = ""; i.onerror = () => { i.onerror = null; i.src = p.u; }; i.src = p.th; s.append(i);
  });
}

/* susunan foto */
let view = [], shown = 0, heights = [], cols = [];
function layout() {
  view = ALL;
  const wall = $("wall"), n = Math.max(2, Math.min(6, Math.floor(wall.clientWidth / 240)));
  wall.innerHTML = ""; cols = []; heights = Array(n).fill(0); shown = 0;
  for (let i = 0; i < n; i++) { const c = document.createElement("div"); c.className = "col"; wall.append(c); cols.push(c); }
  more();
}
function more() {
  const end = Math.min(shown + 40, view.length);
  for (; shown < end; shown++) add(shown);
  io.unobserve($("more")); io.observe($("more"));
}
function add(i) {
  const p = view[i], c = heights.indexOf(Math.min(...heights));
  heights[c] += p.h / p.w;
  const fig = document.createElement("figure");
  fig.className = "ph"; fig.tabIndex = 0; fig.style.aspectRatio = p.w + "/" + p.h;
  fig.innerHTML = `<img loading="lazy" decoding="async" alt=""><figcaption><span></span><div class="acts"><a class="dl" download aria-label="Unduh foto"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-5-5m5 5l5-5M5 20h14"/></svg></a></div></figcaption>`;
  const img = fig.querySelector("img");
  img.alt = p.t; img.src = p.th; img.onerror = () => { img.onerror = null; img.src = p.u; };
  fig.querySelector("span").textContent = p.t;
  const a = fig.querySelector("a"); a.href = p.d || p.u; a.setAttribute("download", p.f.split("/").pop());
  a.onclick = e => e.stopPropagation();
  if (canDel(p)) {
    const b = document.createElement("button");
    b.className = "del"; b.setAttribute("aria-label", "Hapus foto");
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
    b.onclick = e => { e.stopPropagation(); hapus(p); };
    fig.querySelector(".acts").append(b);
  }
  fig.onclick = () => open(i);
  fig.onkeydown = e => { if (e.key === "Enter" && e.target === fig) open(i); };
  cols[c].append(fig);
}
const io = new IntersectionObserver(es => { if (es[0].isIntersecting && shown < view.length) more(); }, {rootMargin: "900px"});
let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 200); });

/* tampilan besar */
let cur = 0;
function show(i) {
  cur = (i + view.length) % view.length;
  const p = view[cur];
  $("lbImg").src = p.u; $("lbImg").alt = p.t;
  $("lbT").textContent = (cur + 1) + " / " + view.length + (p.t ? " · " + p.t : "");
  $("lbDel").hidden = !canDel(p);
  $("lbDl").href = p.d || p.u; $("lbDl").setAttribute("download", p.f.split("/").pop());
  const nx = new Image(); nx.src = view[(cur + 1) % view.length].u;
}
function open(i) { show(i); $("lb").classList.add("on"); $("x").focus(); }
function shut() { $("lb").classList.remove("on"); }
$("lbDel").onclick = () => hapus(view[cur]);
$("prev").onclick = () => show(cur - 1); $("next").onclick = () => show(cur + 1); $("x").onclick = shut;
$("lb").onclick = e => { if (e.target === $("lb")) shut(); };
addEventListener("keydown", e => {
  if (!$("lb").classList.contains("on")) return;
  if (e.key === "Escape") shut(); if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1);
});
let tx = 0;
$("lb").addEventListener("touchstart", e => tx = e.touches[0].clientX, {passive: true});
$("lb").addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 60) show(cur + (d < 0 ? 1 : -1)); });

/* hapus */
async function hapus(p) {
  if (!canDel(p)) { toast("Batas waktu hapus sudah lewat. Hapus lewat Cloudinary Media Library."); return; }
  try {
    if (p.pid) {
      const fd = new FormData(); fd.append("token", p.tok);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`, {method: "POST", body: fd});
      if (!r.ok) throw new Error("gagal");
      CLOUDS = CLOUDS.filter(x => x !== p);
      delete TOKENS[p.pid]; store.set("galeri-tokens", TOKENS);
      GONE.add(p.pid); store.set("galeri-gone", [...GONE]);
    } else {
      if (p.u.startsWith("blob:")) URL.revokeObjectURL(p.u);
      LOCAL = LOCAL.filter(x => x !== p);
    }
    shut(); refresh(true); toast("Foto dihapus.");
  } catch { toast("Gagal menghapus. Batas waktu 10 menit mungkin sudah lewat."); }
}

/* unggah */
let tt;
function toast(msg, keep) {
  const t = $("toast"); t.textContent = msg; t.style.display = "block"; clearTimeout(tt);
  if (!keep) tt = setTimeout(() => t.style.display = "none", 3500);
}
async function shrink(file) {            // kecilkan foto besar dari HP sebelum diunggah
  try {
    const bm = await createImageBitmap(file), s = Math.min(1, 2400 / Math.max(bm.width, bm.height));
    const c = document.createElement("canvas"); c.width = Math.round(bm.width * s); c.height = Math.round(bm.height * s);
    c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .9));
    return {blob, w: c.width, h: c.height};
  } catch { return {blob: file, w: 4, h: 3}; }
}
$("fab").onclick = () => $("pick").click();
$("pick").onchange = async e => {
  const files = [...e.target.files].filter(f => f.type.startsWith("image/")); e.target.value = "";
  let ok = 0;
  for (let i = 0; i < files.length; i++) {
    toast("Mengunggah " + (i + 1) + " dari " + files.length + "…", true);
    try {
      const {blob, w, h} = await shrink(files[i]);
      if (CL) {
        const fd = new FormData();
        fd.append("file", blob, files[i].name); fd.append("upload_preset", UPLOAD_PRESET); fd.append("tags", TAG);
        const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {method: "POST", body: fd});
        if (!r.ok) throw new Error("gagal");
        const j = await r.json();
        if (j.delete_token) { TOKENS[j.public_id] = {t: j.delete_token, e: Date.now() + 9 * 60 * 1000}; store.set("galeri-tokens", TOKENS); }
        CLOUDS.push(fromCloud({...j, created_at: new Date().toISOString()}));
      } else {
        const u = URL.createObjectURL(blob);
        LOCAL.unshift({f: files[i].name, t: "", w, h, u, th: u, ts: 0, own: true});
      }
      ok++;
    } catch { toast("Gagal mengunggah " + files[i].name); await new Promise(r => setTimeout(r, 1800)); }
  }
  if (ok) { refresh(false); toast(ok + " foto berhasil ditambahkan."); } else $("toast").style.display = "none";
};

refresh(true);
if (CL) {
  fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${TAG}.json`)
    .then(r => r.ok ? r.json() : {resources: []})
    .then(j => { CLOUDS = (j.resources || []).filter(r => !GONE.has(r.public_id)).map(fromCloud); })
    .catch(() => {})
    .finally(() => { ready = true; refresh(true); });
}
