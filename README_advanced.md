# 🤖 Auto Form Filler Advanced

Ekstensi Chrome canggih untuk mengisi form otomatis dengan jadwal dan data pribadi yang dapat disesuaikan.

## ✨ Fitur Utama

### 📋 Pengisian Form Otomatis
- **Nama lengkap** - Input teks otomatis
- **Jenis kelamin** - Radio button (L/P)
- **Kelas** - Radio button (IV RKS Echo, IV RKS Trace, IV RKS Route, IV RPKK, IV RSK, IV RPLK)
- **Keperluan** - Textarea untuk deskripsi
- **Lokasi** - Radio button (sama dengan pilihan kelas)
- **Asrama** - Radio button (E/F)

### ⏰ Penjadwalan Otomatis
- Jadwal harian per hari dalam seminggu
- Pengaturan waktu spesifik untuk setiap hari
- Auto-open dan fill form pada waktu yang ditentukan
- Backup timer dan Chrome Alarms API
- Persisten schedule (tetap aktif setelah browser restart)

### 🎯 Smart Form Detection
- Mendeteksi field berdasarkan name, id, placeholder, dan label
- Support multiple field mapping (nama, name, fullname, dll)
- Radio button value mapping otomatis
- Fallback detection untuk berbagai format form

### 🔧 Fitur Lanjutan
- Form URL fleksibel (Google Forms, custom forms, dll)
- Test schedule untuk debugging
- Live status indicator
- Notifikasi visual saat form terisi
- Form analysis dan debugging tools

## 📁 Struktur File

```
jamal/
├── manifest.json              # Konfigurasi ekstensi
├── popup_advanced.html        # UI popup utama
├── popup_advanced.js          # Logika popup dan settings
├── background.js              # Service worker untuk scheduling
├── content_advanced.js        # Script untuk mengisi form
├── styles_fixed.css          # CSS styling
├── test_form_advanced.html    # Form test untuk debugging
├── icons/                    # Folder ikon ekstensi
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README_advanced.md        # Dokumentasi ini
```

## 🚀 Cara Instalasi

### 1. Download dan Extract
```bash
# Download atau clone repository
git clone <repository-url>
cd jamal
```

### 2. Load Extension di Chrome
1. Buka Chrome dan ketik `chrome://extensions/`
2. Aktifkan "Developer mode" di pojok kanan atas
3. Klik "Load unpacked"
4. Pilih folder `jamal`
5. Ekstensi akan muncul di toolbar Chrome

### 3. Setup Permissions
- Ekstensi akan meminta permission untuk:
  - Storage (menyimpan pengaturan)
  - Tabs (membuka tab baru)
  - Alarms (jadwal otomatis)
  - Host permissions untuk berbagai domain

## 📖 Cara Penggunaan

### 📝 Pengaturan Data Form

1. **Klik ikon ekstensi** di toolbar Chrome
2. **Isi data pribadi:**
   - Nama lengkap
   - Pilih jenis kelamin
   - Pilih kelas (10/11/12)
   - Isi keperluan
   - Pilih lokasi (Sekolah/Asrama/Luar)
   - Pilih asrama (A/B/C/D)

3. **Masukkan URL form** target:
   ```
   https://docs.google.com/forms/d/1abc123.../viewform
   ```

### ⏰ Pengaturan Jadwal Otomatis

1. **Aktifkan jadwal otomatis** dengan mencentang checkbox
2. **Pilih hari-hari** yang diinginkan
3. **Atur waktu** untuk setiap hari (format 24 jam)
4. **Klik "Simpan Pengaturan"**

### 🚀 Mengisi Form

#### Manual
- Klik tombol **"Isi Form Sekarang"**
- Form akan terbuka di tab baru dan terisi otomatis

#### Otomatis
- Form akan terbuka dan terisi sesuai jadwal yang diatur
- Notifikasi akan muncul saat jadwal terpicu

### 🧪 Testing

1. **Buka `test_form_advanced.html`** di browser
2. **Test manual:** Gunakan tombol "Isi Form Sekarang"
3. **Test schedule:** Gunakan tombol "Test Schedule"
4. **Lihat Console** untuk debugging info

## ⚙️ Konfigurasi Lanjutan

### Field Mapping
Ekstensi otomatis mendeteksi field berdasarkan:

```javascript
FIELD_MAPPINGS = {
    nama: ['nama', 'name', 'fullname', 'student_name'],
    jenisKelamin: ['jenis_kelamin', 'gender', 'sex'],
    kelas: ['kelas', 'class', 'grade', 'level'],
    keperluan: ['keperluan', 'purpose', 'reason'],
    lokasi: ['lokasi', 'location', 'destination'],
    asrama: ['asrama', 'dormitory', 'dorm']
}
```

### Radio Button Values
```javascript
RADIO_VALUE_MAPPINGS = {
    jenisKelamin: {
        'L': ['laki-laki', 'male', 'l', 'pria'],
        'P': ['perempuan', 'female', 'p', 'wanita']
    },
    kelas: {
        'IV RKS Echo': ['iv rks echo', 'echo', 'rks echo'],
        'IV RKS Trace': ['iv rks trace', 'trace', 'rks trace'],
        // ... mapping lainnya
    }
}
```

## 🔧 Troubleshooting

### Form Tidak Terisi
1. **Periksa Console** (F12) untuk error messages
2. **Cek field mapping** - pastikan nama field sesuai
3. **Test di `test_form_advanced.html`** terlebih dahulu
4. **Periksa URL form** - pastikan accessible

### Jadwal Tidak Berjalan
1. **Periksa status indicator** di popup (hijau = aktif)
2. **Test dengan "Test Schedule"**
3. **Periksa permission** Alarms di Chrome
4. **Restart Chrome** untuk refresh alarms

### Ekstensi Tidak Muncul
1. **Periksa Chrome Extensions** (`chrome://extensions/`)
2. **Enable Developer Mode**
3. **Reload ekstensi** jika ada error
4. **Periksa file manifest.json**

## 📊 Debugging

### Console Logs
```javascript
// Content script logs
console.log('Content script advanced loaded');
console.log('Form analysis:', analysis);

// Background script logs  
console.log('Alarm triggered:', alarm);
console.log('Schedule match found:', matchingDay);

// Popup logs
console.log('Settings saved:', {formData, scheduleSettings});
```

### Chrome DevTools
1. **Inspect Popup:** Klik kanan pada popup → Inspect
2. **Service Worker:** `chrome://extensions/` → Background page
3. **Content Script:** Inspect halaman form → Console
4. **Storage:** Application tab → Storage → Local/Sync

## 🔒 Privacy & Security

- **Data lokal:** Semua data disimpan di Chrome Storage lokal
- **No tracking:** Tidak ada pengiriman data ke server eksternal
- **Permissions minimal:** Hanya akses yang diperlukan
- **Open source:** Kode dapat diaudit dan dimodifikasi

## 🤝 Kontribusi

### Development Setup
```bash
# Clone repository
git clone <repo-url>
cd jamal

# Edit files dengan text editor favorit
# Test di Chrome dengan Load Unpacked
# Submit pull request untuk improvements
```

### File Penting untuk Edit
- `popup_advanced.js` - Logika UI dan settings
- `content_advanced.js` - Form detection dan filling
- `background.js` - Scheduling dan alarms
- `popup_advanced.html` - UI popup

## 📝 Changelog

### v2.1.1 (Current)
- ✅ Google Forms native structure support (span.M7eMe, div[role="radio"])
- ✅ Fixed radio button detection dengan data-value dan aria-label
- ✅ Improved text field detection dengan proximity search
- ✅ Enhanced input validation (skip time/date fields)
- ✅ Better conflict prevention untuk field keperluan
- ✅ Comprehensive Google Forms debugging logs
- ✅ Simulated typing untuk better form compatibility

### v2.1.0
- ✅ Text-based field detection untuk Google Forms
- ✅ Updated field values: L/P untuk jenis kelamin
- ✅ Kelas pilihan: IV RKS Echo/Trace/Route, IV RPKK/RSK/RPLK
- ✅ Lokasi sama dengan pilihan kelas
- ✅ Asrama E dan F
- ✅ Enhanced debugging dan logging
- ✅ Improved Google Forms compatibility

### v2.0.0
- ✅ Advanced form fields (6 fields dengan radio buttons)
- ✅ Scheduling system dengan Chrome Alarms
- ✅ Smart field detection dan mapping
- ✅ Background service worker
- ✅ Comprehensive error handling
- ✅ Test form dan debugging tools

### v1.0.0 (Legacy)
- ✅ Basic form filling
- ✅ Simple time/date picker
- ✅ Manual fill only

## 📞 Support

Jika mengalami masalah:
1. Periksa troubleshooting section di atas
2. Test dengan `test_form_advanced.html`
3. Periksa Console untuk error messages
4. Create issue di repository jika bug persisten

---

**🎯 Auto Form Filler Advanced** - Solusi pengisian form otomatis yang canggih dan fleksibel! 