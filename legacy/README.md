# CV Builder

Website statis untuk membuat CV/resume **ATS-friendly** (Jake-style, 1 kolom).

## Fitur

- Form section: Personal, Summary, Education, Experience, Projects, Publications, Skills, Languages
- Live preview gaya Jake's Resume
- Auto-save ke `localStorage`
- Export / Import JSON
- Export PDF via Print dialog browser (`Ctrl+P` / tombol Export PDF)
- Sample data profil Surya (default)

## Jalankan

Tidak perlu build. Buka langsung:

```bash
# opsi 1 — buka file
xdg-open cv-builder/index.html

# opsi 2 — static server
npx serve cv-builder
# atau
python3 -m http.server 5173 --directory cv-builder
```

Lalu buka `http://localhost:5173`.

## Export PDF

1. Klik **Export PDF** (atau `Ctrl+P`)
2. Destination: **Save as PDF**
3. Margins: **None** (atau Default — resume sudah punya padding internal)
4. Background graphics: on (opsional)

## Struktur

```
cv-builder/
  index.html
  css/style.css
  js/default-data.js   # sample + empty template
  js/app.js            # state, form, preview, export
  README.md
```
