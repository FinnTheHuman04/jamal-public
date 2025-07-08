# 📁 Icons Folder

Folder ini berisi ikon-ikon untuk ekstensi Google Form Auto Filler.

## 📋 Required Icons

Ekstensi membutuhkan 3 ukuran ikon:

- `icon16.png` - 16x16 pixels (untuk toolbar)
- `icon48.png` - 48x48 pixels (untuk extension management page)  
- `icon128.png` - 128x128 pixels (untuk Chrome Web Store)

## 🎨 Design Guidelines

### Konsep Ikon
- **Theme**: Form automation, schedule, clock
- **Colors**: Blue gradient (#4facfe to #00f2fe)
- **Style**: Modern, flat design dengan sedikit shadow
- **Elements**: Kombinasi form/document + clock/calendar

### Contoh SVG Template

Berikut contoh SVG yang bisa digunakan sebagai base:

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <circle cx="64" cy="64" r="60" fill="url(#bgGradient)" />
  
  <!-- Form/Document -->
  <rect x="35" y="25" width="40" height="50" rx="4" fill="white" opacity="0.9"/>
  <rect x="40" y="35" width="30" height="3" rx="1" fill="#4facfe"/>
  <rect x="40" y="42" width="25" height="3" rx="1" fill="#4facfe"/>
  <rect x="40" y="49" width="20" height="3" rx="1" fill="#4facfe"/>
  <rect x="40" y="56" width="28" height="3" rx="1" fill="#4facfe"/>
  
  <!-- Clock -->
  <circle cx="78" cy="85" r="20" fill="white" stroke="#4facfe" stroke-width="2"/>
  <circle cx="78" cy="85" r="2" fill="#4facfe"/>
  <line x1="78" y1="85" x2="78" y2="75" stroke="#4facfe" stroke-width="2" stroke-linecap="round"/>
  <line x1="78" y1="85" x2="85" y2="85" stroke="#4facfe" stroke-width="2" stroke-linecap="round"/>
</svg>
```

## 🛠️ Cara Membuat Icons

### Metode 1: Online SVG to PNG Converter
1. Copy SVG code di atas
2. Buka [convertio.co](https://convertio.co/svg-png/) atau [cloudconvert.com](https://cloudconvert.com/svg-to-png)
3. Upload SVG atau paste code
4. Set ukuran output:
   - 16x16 untuk icon16.png
   - 48x48 untuk icon48.png  
   - 128x128 untuk icon128.png
5. Download hasil PNG

### Metode 2: Menggunakan Figma/Canva
1. Buat design baru dengan ukuran 128x128
2. Gunakan konsep design di atas
3. Export dalam 3 ukuran berbeda
4. Save sebagai PNG

### Metode 3: Menggunakan GIMP/Photoshop
1. Buat dokumen baru 128x128
2. Buat design mengikuti guidelines
3. Resize untuk ukuran 48x48 dan 16x16
4. Export sebagai PNG dengan compression optimal

## 🎯 Quick Setup (Placeholder)

Jika ingin cepat testing ekstensi, Anda bisa:

1. Download ikon placeholder dari:
   - [Icon 16x16](https://via.placeholder.com/16x16/4facfe/ffffff?text=GF)
   - [Icon 48x48](https://via.placeholder.com/48x48/4facfe/ffffff?text=GF)  
   - [Icon 128x128](https://via.placeholder.com/128x128/4facfe/ffffff?text=GF)

2. Rename sesuai dengan nama yang dibutuhkan
3. Simpan di folder `icons/`

## ✅ Checklist

- [ ] icon16.png (16x16 pixels)
- [ ] icon48.png (48x48 pixels)
- [ ] icon128.png (128x128 pixels)
- [ ] All icons follow design guidelines
- [ ] Icons are optimized for file size
- [ ] Icons look good on both light and dark backgrounds

## 🎨 Color Palette

```
Primary: #4facfe
Secondary: #00f2fe
White: #ffffff
Dark: #333333
Light Gray: #f8f9fa
```

---

**Note**: Setelah membuat ikon, pastikan nama file sesuai dengan yang tercantum di `manifest.json`! 