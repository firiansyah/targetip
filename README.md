# TargetIP

Kalkulator nilai minimal, IP semester, dan simulasi target IPK untuk mahasiswa. Dibangun sepenuhnya dengan **IBM Bob** sebagai AI agent untuk Capstone Project Hacktiv8 x IBM (Track IBM Bob).

**Demo:** https://firiansyah.github.io/targetip/

## Masalah yang diselesaikan

Setiap dosen menetapkan bobot komponen nilai yang berbeda (tugas, kuis, ETS, EAS, dan lainnya). Menghitung berapa nilai yang masih dibutuhkan biasanya dilakukan manual, tersebar di kalkulator dan catatan HP, sehingga mahasiswa baru sadar posisi nilainya mendekati akhir semester, saat peluang memperbaiki sudah terbatas. TargetIP memusatkan perhitungan itu dalam satu aplikasi.

## Target pengguna

Mahasiswa S1 yang memakai sistem SKS dan nilai huruf skala 4,0 (skala ITS: A, AB, B, BC, C, D, E), terutama menjelang ETS dan EAS.

## Fitur

- **Landing page dan navigasi**: halaman beranda yang menjelaskan fitur, dengan menu atas (Beranda, Nilai Minimum, IP Semester, Simulasi IPK, Skala Nilai). Tombol back pada browser berfungsi karena memakai routing hash.
- **Nilai Minimum**: input komponen dan bobot sendiri per mata kuliah (default Tugas 10%, Quiz 10%, ETS 40%, EAS 40%), pilih huruf target, lalu aplikasi menampilkan:
  - nilai minimum yang dibutuhkan untuk setiap huruf,
  - skenario merata (semua komponen tersisa dapat nilai sama),
  - batas bawah tiap komponen (bila komponen sisa lain dapat 100),
  - simulasi estimasi nilai,
  - peringatan jika target sudah tidak mungkin dicapai.
- **IP Semester**: terhubung otomatis dengan Nilai Minimum. Huruf tiap mata kuliah diambil dari nilai aktual (bila semua komponen sudah keluar), huruf target, atau pilihan manual. Aplikasi menampilkan dua prediksi: *IP jika semua target tercapai* dan *IP realistis* (target yang sudah tidak mungkin diganti huruf tertinggi yang masih bisa dicapai), plus prediksi IPK setelah semester ini.
- **Simulasi IPK**: hitung IP yang dibutuhkan semester depan untuk mencapai IPK target.
- **Skala Nilai**: default mengikuti skala ITS, dan batas angka tiap huruf serta batas lulus dapat diubah sesuai aturan dosen.
- **Penyimpanan otomatis** di browser (localStorage). Data tidak dikirim ke server mana pun.

## Skala nilai default (ITS)

| Huruf | Rentang | Angka mutu |
|---|---|---|
| A | 86 - 100 | 4,0 |
| AB | 76 - 85 | 3,5 |
| B | 66 - 75 | 3,0 |
| BC | 61 - 65 | 2,5 |
| C | 56 - 60 | 2,0 |
| D | 41 - 55 | 1,0 |
| E | 0 - 40 | 0,0 |

Sumber: halaman peraturan dan informasi akademik di situs resmi ITS (its.ac.id).

## Cara pakai

1. Buka link demo di atas, atau unduh `index.html` dan buka di browser.
2. Tambah mata kuliah, isi SKS, bobot, dan nilai komponen yang sudah keluar (kosongkan yang belum).
3. Pilih huruf target dan baca hasil analisisnya.
4. Buka menu IP Semester untuk melihat prediksi IP dari target tiap mata kuliah.

## Rumus

Nilai akhir, dengan $w_i$ bobot komponen (pecahan, $\sum w_i = 1$) dan $x_i$ nilainya:

$$N = \sum_i w_i\,x_i$$

Dengan $P$ poin dari komponen yang sudah keluar dan $W_U$ total bobot komponen tersisa, rata-rata minimal yang dibutuhkan:

$$\bar{x}_{\min} = \frac{N_{\text{target}} - P}{W_U}$$

Batas bawah komponen $k$ bila komponen sisa lainnya mendapat 100:

$$x_{k,\min} = \frac{N_{\text{target}} - P - 100\,(W_U - w_k)}{w_k}$$

IP semester, dengan $s_j$ SKS dan $m_j$ angka mutu:

$$IP = \frac{\sum_j s_j\,m_j}{\sum_j s_j}$$

IPK setelah semester berjalan, dari rata-rata terbobot SKS atas seluruh mata kuliah:

$$IPK_{\text{baru}} = \frac{IPK_{\text{now}}\,S_{\text{lalu}} + IP\,S_{\text{sem}}}{S_{\text{lalu}} + S_{\text{sem}}}$$

IP yang dibutuhkan semester depan untuk mencapai IPK target:

$$IP_{\text{needed}} = \frac{IPK_{\text{target}}\,(S_{\text{lalu}} + S_{\text{baru}}) - IPK_{\text{now}}\,S_{\text{lalu}}}{S_{\text{baru}}}$$

## Teknologi

HTML, CSS, dan JavaScript murni dalam satu file `index.html`, tanpa framework dan tanpa library. Satu-satunya sumber eksternal adalah font Poppins dari Google Fonts (dengan font sistem sebagai cadangan).

## Arsitektur prompt (3 layer)

Prompt ke IBM Bob disusun dalam tiga lapisan, dan setiap revisi hanya menyentuh satu layer yang bermasalah (satu masalah = satu layer).

| Layer | Isi | Tujuan |
|---|---|---|
| 1. Role & Context | Senior frontend engineer, TargetIP, batasan satu file, vanilla JS, localStorage, UI berbahasa Indonesia | Menetapkan peran, konteks, dan batas teknologi |
| 2. Task & Requirements | Fitur, rumus, skala nilai yang dapat diedit, validasi, kasus tepi, penyimpanan | Menentukan secara spesifik apa yang dibangun |
| 3. Constraints & Output | Tampilan, responsif, aksesibilitas, format file, acceptance test | Mengunci kualitas dan kriteria hasil yang benar |

Contoh acceptance test di Layer 3: Tugas 20% nilai 80, ETS 40% nilai 65, EAS 40% kosong, target 70, maka EAS minimal harus 70.

## Iterasi prompt

| # | Masalah | Layer yang direvisi | Hasil |
|---|---|---|---|
| 1 | Tombol "Tambah Komponen" mengisi "Komponen Baru" yang harus dihapus manual | Layer 2 | Baris baru kosong, otomatis fokus, placeholder saran bergilir |
| 2 | Mata kuliah baru selalu kosong | Layer 2 | Komponen default Tugas, Quiz, ETS, EAS |
| 3 | Hanya ada satu angka rata-rata minimal | Layer 2 | Analisis per komponen dengan tiga sudut pandang dan penanganan target tidak mungkin |
| 4 | Tampilan gelap dan terasa generik | Layer 3 | Desain terang dengan hierarki jelas, ikon SVG tanpa emoji |
| 5 | Latar hijau terlalu dominan, judul hero tercampur dengan halaman kalkulator | Layer 3 dan Layer 2 | Latar putih hangat, landing page terpisah, navigasi atas dengan routing hash |
| 6 | Data mata kuliah harus diisi terpisah di Nilai Minimum dan IP Semester | Layer 2 | Huruf target otomatis menjadi input IP, dua prediksi (target tercapai dan realistis), proyeksi IPK |
| 7 | Skala nilai default belum sesuai skala resmi ITS | Layer 2 | Skala default diganti sesuai ITS, data lama dimigrasi otomatis bila masih memakai default lama |

## Struktur repo

```
.
├── index.html   # seluruh aplikasi (HTML, CSS, JS)
└── README.md
```
