# 🏭 MP Development Management System

Sistem manajemen manpower yang modern dan profesional untuk mengelola data karyawan, recruitment, kontrak, dan program edukasi.

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [File Structure](#-file-structure)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Contributing](#-contributing)

## ✨ Features

### 🎯 Core Modules
- **Dashboard** - Overview dan statistik real-time
- **Database MP** - CRUD lengkap untuk data karyawan
- **End Contract** - Manajemen kontrak berakhir
- **Recruitment** - Tracking proses recruitment
- **Edukasi** - Manajemen program pelatihan

### 🎨 UI/UX Features
- ✅ Modern & Professional Design
- ✅ Fully Responsive (Desktop, Tablet, Mobile)
- ✅ Dark Gradient Theme
- ✅ Smooth Animations & Transitions
- ✅ Interactive Components
- ✅ Real-time Search & Filter
- ✅ Modal Forms
- ✅ Status Indicators
- ✅ Notification System

### ⚡ Functionality
- ✅ CRUD Operations (Create, Read, Update, Delete)
- ✅ Auto-generate NPK
- ✅ Data Validation
- ✅ Export to CSV
- ✅ Real-time Search
- ✅ Keyboard Shortcuts
- ✅ Form Validation
- ✅ Error Handling

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Modern CSS with Flexbox & Grid
- **Icons**: Unicode Emojis
- **Responsive**: CSS Media Queries
- **No Dependencies**: Pure JavaScript, no external libraries

## 🚀 Installation

### Prerequisites
- VS Code (recommended)
- Live Server Extension

### Setup Steps

1. **Clone atau Download Project**
   ```bash
   git clone <repository-url>
   # atau download ZIP dan extract
   ```

2. **Buka di VS Code**
   ```bash
   cd mp-development
   code .
   ```

3. **Install Live Server Extension**
   - Buka Extensions (Ctrl+Shift+X)
   - Search "Live Server"
   - Install extension dari Ritwick Dey

4. **Run Project**
   - Klik kanan pada `index.html`
   - Pilih "Open with Live Server"
   - Browser akan otomatis terbuka di http://localhost:5500

## 📁 File Structure

```
mp-development/
│
├── 📄 index.html          # Main HTML file
├── 📁 css/
│   └── 📄 style.css       # All CSS styles
├── 📁 js/
│   └── 📄 script.js       # All JavaScript functionality
├── 📁 assets/             # Images, icons (if needed)
│   ├── 📁 images/
│   └── 📁 icons/
└── 📄 README.md           # Documentation
```

## 💡 Usage

### Basic Operations

#### 1. Navigasi
- Klik menu di sidebar untuk berpindah antar modul
- Dashboard menampilkan overview dan statistik

#### 2. Menambah Data Karyawan
- Masuk ke menu "Database MP"
- Klik tombol "+ Tambah Karyawan"
- Isi form lengkap
- Klik "Simpan"

#### 3. Edit Data
- Klik tombol "Edit" pada baris data
- Ubah data sesuai kebutuhan
- Klik "Simpan"

#### 4. Hapus Data
- Klik tombol "Delete" pada baris data
- Konfirmasi penghapusan

#### 5. Pencarian
- Gunakan search box untuk mencari data
- Hasil akan difilter secara real-time

### Advanced Features

#### Export Data
```javascript
// Panggil function exportToCSV() di console
exportToCSV();
```

#### Custom NPK Generation
NPK akan otomatis di-generate dengan format NPK001, NPK002, dst.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Tambah karyawan baru (dalam Database MP) |
| `Escape` | Tutup modal |
| `Ctrl + S` | Simpan form (dalam modal) |

## 🎨 Customization

### Mengubah Warna Theme
Edit file `css/style.css`:

```css
/* Ubah gradient sidebar */
.sidebar {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

/* Ubah warna primary */
.btn-primary {
    background: #your-primary-color;
}
```

### Menambah Field Baru
1. Edit form di `index.html`:
```html
<div class="form-group">
    <label for="newField">Field Baru</label>
    <input type="text" id="newField" name="newField">
</div>
```

2. Update table header di `index.html`
3. Update JavaScript di `js/script.js` untuk handle field baru

### Menambah Section Baru
1. Tambah navigation item di sidebar
2. Buat section baru dengan id unik
3. Update JavaScript navigation handler

## 🔧 Development

### Struktur CSS
```
style.css
├── Reset & Base Styles
├── Sidebar Styles
├── Main Content Styles
├── Dashboard Cards
├── Content Section Styles
├── Button Styles
├── Table Styles
├── Status Badge Styles
├── Modal Styles
├── Form Styles
├── Utility Classes
└── Responsive Styles
```

### JavaScript Modules
```
script.js
├── Navigation Functionality
├── CRUD Functionality
├── Search Functionality
├── Auto-generate NPK
├── Notification System
├── Clock Functionality
├── Data Export
├── Data Validation
├── Keyboard Shortcuts
├── Mobile Menu Toggle
└── Error Handling
```

## 📱 Mobile Responsiveness

- ✅ Responsive sidebar (hamburger menu)
- ✅ Optimized table scrolling
- ✅ Touch-friendly buttons
- ✅ Adaptive grid layouts
- ✅ Mobile-first form design

## 🔐 Data Security

- Form validation pada client-side
- NPK uniqueness check
- Input sanitization
- Error handling untuk stability

## 🚀 Future Enhancements

- [ ] Database integration (MySQL/PostgreSQL)
- [ ] User authentication & authorization
- [ ] Role-based access control
- [ ] Advanced reporting & analytics
- [ ] Email notifications
- [ ] File upload untuk foto karyawan
- [ ] Bulk import/export
- [ ] Advanced filtering & sorting
- [ ] Print functionality
- [ ] Multi-language support

## 🐛 Troubleshooting

### Common Issues

1. **Live Server tidak jalan**
   - Pastikan extension terinstall
   - Restart VS Code
   - Klik kanan pada index.html → Open with Live Server

2. **Modal tidak muncul**
   - Check console untuk error JavaScript
   - Pastikan semua file ter-link dengan benar

3. **Styling tidak muncul**
   - Pastikan path CSS benar: `css/style.css`
   - Check browser developer tools

4. **JavaScript error**
   - Buka browser console (F12)
   - Check error message
   - Pastikan script.js ter-load

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check dokumentasi ini terlebih dahulu
2. Check browser console untuk error
3. Pastikan semua file ada di folder yang benar
4. Restart Live Server

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Coding! 🎉**

> Dibuat dengan ❤️ untuk memudahkan manajemen manpower di perusahaan Anda.
```

File README.md ini sudah sangat lengkap dan mencakup:

✅ **Dokumentasi lengkap** tentang semua fitur sistem
✅ **Panduan instalasi** step-by-step
✅ **Struktur file** yang jelas
✅ **Panduan penggunaan** untuk setiap modul
✅ **Keyboard shortcuts** dan customization
✅ **Troubleshooting guide** untuk masalah umum
✅ **Future enhancements** roadmap
✅ **Mobile responsiveness** info
✅ **Security considerations**
