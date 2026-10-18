#!/usr/bin/env python3
"""
Membagi foto di folder "foto" menjadi subfolder berisi maksimal 100 foto
(bagian-01, bagian-02, ...) supaya bisa diunggah lewat website GitHub,
yang membatasi 100 file per sekali kirim.

Cara pakai (dari dalam folder galeri, sejajar dengan folder "foto"):
    python bagi_folder.py
Setelah selesai, jalankan skrip pembuat daftar lagi (daftar.py / buat_daftar.py)
agar data.js dan folder thumb mengikuti susunan yang baru.
"""
import os
import re
import shutil

PER_FOLDER = 100
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def natural(teks):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", teks.lower())]


if not os.path.isdir("foto"):
    raise SystemExit('Folder "foto" tidak ditemukan. Jalankan dari dalam folder galeri.')

files = sorted(
    (f for f in os.listdir("foto")
     if os.path.isfile(os.path.join("foto", f)) and os.path.splitext(f)[1].lower() in EXT),
    key=natural,
)
if not files:
    raise SystemExit("Tidak ada foto yang langsung berada di folder foto (mungkin sudah dibagi).")

jumlah = (len(files) + PER_FOLDER - 1) // PER_FOLDER
print(f"{len(files)} foto akan dibagi ke {jumlah} folder (maksimal {PER_FOLDER} foto per folder).")
print("Folder thumb lama akan dihapus karena dibuat ulang oleh skrip pembuat daftar.")
if input("Lanjut? (y/n): ").strip().lower() != "y":
    raise SystemExit("Dibatalkan, tidak ada yang diubah.")

for i, f in enumerate(files):
    tujuan = os.path.join("foto", f"bagian-{i // PER_FOLDER + 1:02d}")
    os.makedirs(tujuan, exist_ok=True)
    shutil.move(os.path.join("foto", f), os.path.join(tujuan, f))

if os.path.isdir("thumb"):
    shutil.rmtree("thumb")

print(f"Selesai: {len(files)} foto dipindah ke {jumlah} folder.")
print("Langkah berikutnya: jalankan skrip pembuat daftar (daftar.py) lagi.")