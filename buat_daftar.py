#!/usr/bin/env python3
"""
Jalankan skrip ini setiap kali kamu menambah foto:   python buat_daftar.py

Yang dilakukan:
  - membaca semua foto di folder "foto" (termasuk subfolder)
  - membuat thumbnail ringan di folder "thumb" supaya web cepat
  - mengurutkan foto sesuai pengaturan di bawah
  - menulis data.js yang dibaca index.html

Butuh Pillow untuk thumbnail dan tanggal foto:   python -m pip install pillow
(tanpa Pillow, daftar tetap dibuat tapi web memakai foto asli sebagai pratinjau)
"""
import json
import os
import re
from datetime import datetime

# ===== PENGATURAN URUTAN =====
# "nama"          : urut nama file (angka dibaca wajar: foto2 sebelum foto10)
# "tanggal_foto"  : urut waktu pengambilan foto (dari data kamera/HP);
#                   bila tidak ada, dipakai tanggal ubah file
# "tanggal_file"  : urut tanggal ubah file di komputer
URUTAN = "nama"
TERBARU_DULU = False    # True = foto terbaru tampil paling atas
# =============================

EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    print("Pillow belum terpasang: thumbnail dilewati. Pasang dengan: python -m pip install pillow")

if not os.path.isdir("foto"):
    raise SystemExit('Folder "foto" tidak ditemukan. Jalankan skrip ini dari dalam folder galeri.')


def natural(teks):
    """Urutan alami: 'foto2' berada sebelum 'foto10'."""
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", teks.lower())]


def ambil_tanggal(im, cadangan):
    """Waktu pengambilan foto dari EXIF; bila tidak ada, pakai cadangan."""
    try:
        ex = im.getexif()
        s = ex.get_ifd(0x8769).get(36867) or ex.get(306)
        if s:
            return datetime.strptime(str(s).strip()[:19], "%Y:%m:%d %H:%M:%S").timestamp()
    except Exception:
        pass
    return cadangan


items = []
for root, _, files in os.walk("foto"):
    for fn in files:
        if os.path.splitext(fn)[1].lower() not in EXT:
            continue
        path = os.path.join(root, fn)
        rel = os.path.relpath(path, "foto").replace(os.sep, "/")
        album = rel.split("/")[0] if "/" in rel else ""
        mtime = os.path.getmtime(path)
        taken = mtime
        w = h = 0
        if Image:
            try:
                with Image.open(path) as im:
                    taken = ambil_tanggal(im, mtime)
                    im = ImageOps.exif_transpose(im)
                    w, h = im.size
                    tp = os.path.join("thumb", rel)
                    if not os.path.exists(tp):
                        os.makedirs(os.path.dirname(tp), exist_ok=True)
                        th = im.copy()
                        th.thumbnail((700, 700))
                        th.convert("RGB").save(tp)
            except Exception as e:
                print("Dilewati:", rel, "-", e)
        items.append({"f": rel, "a": album, "w": w, "h": h, "_t": taken, "_m": mtime})

if URUTAN == "tanggal_foto":
    items.sort(key=lambda x: (x["_t"], natural(x["f"])), reverse=TERBARU_DULU)
elif URUTAN == "tanggal_file":
    items.sort(key=lambda x: (x["_m"], natural(x["f"])), reverse=TERBARU_DULU)
else:
    items.sort(key=lambda x: natural(x["f"]), reverse=TERBARU_DULU)

hasil = [{k: v for k, v in x.items() if not k.startswith("_")} for x in items]

with open("data.js", "w", encoding="utf-8") as fh:
    fh.write("window.FOTO = " + json.dumps(hasil, ensure_ascii=False, indent=1) + ";\n")

print(f"Selesai: {len(hasil)} foto ditulis ke data.js (urutan: {URUTAN})")