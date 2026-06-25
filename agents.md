Buatkan blueprint arsitektur lengkap beserta implementasi kode untuk sistem "Notifikasi Real-time dengan Counter Unread Message" menggunakan tumpukan teknologi berikut:

- Backend: Python FastAPI & NATS JetStream (menggunakan library `nats-py`)
- Frontend: Next.js (App Router, Tailwind CSS, TypeScript, dan Lucide React / Phosphor Icons untuk ikon)
- Database State: Gunakan representasi Mock Database (In-Memory Python List/Dict) pada FastAPI yang mensimulasikan penyimpanan data riwayat notifikasi beserta status bacanya (`is_read: bool`).

Sistem ini harus terisolasi penuh menggunakan DOCKER pada sisi backend agar komputer lokal bersih dari instalasi package pihak ketiga.

Sistem ini harus meniru komponen UI halaman notifikasi modern dengan spesifikasi teknis dan fitur sebagai berikut satu per satu dan menunggu konfirmasi untuk melanjutkan :

1. DOCKERIZATION & CONTAINER DEPLOYMENT (BACKEND & INFRASTRUCTURE)
   Sediakan konfigurasi containerization lengkap yang terdiri dari:

- `Dockerfile` untuk Backend FastAPI: Menggunakan base image `python:3.11-slim`, instalasi dependensi via `requirements.txt` (fastapi, uvicorn, nats-py, requests, sse-starlette), dan ekspos port 8000.
- `docker-compose.yml`: Menggabungkan dua layanan (services):
  - `nats`: Menggunakan image resmi `nats:latest` dengan flag `-js` diaktifkan untuk menjalankan fitur JetStream, mengekspos port `4222` (client) dan `8222` (monitoring).
  - `backend`: Berjalan setelah service `nats` siap (`depends_on`), melakukan mounting volume untuk local development, dan memetakan port `8000`.

2. ALUR KERJA REAL-TIME (NATS JETSTREAM)

- Pastikan pada saat startup FastAPI, sebuah Stream bernama "NOTIFICATIONS" dengan subjek "notif.user.\*" diinisialisasi secara otomatis pada NATS JetStream menggunakan URL internal Docker (misal: `nats://nats:4222`).
- Saat notifikasi dipicu, data disimpan ke dalam database mock, lalu di-publish ke subjek spesifik user, misalnya: `notif.user.{safe_user_email}`.
- Buat sebuah endpoint SSE (Server-Sent Events) di FastAPI bernama `/api/notifications/stream?user_email=...`. Endpoint ini bertindak sebagai bridge yang membuat Ephemeral Consumer dengan Kebijakan Pengiriman Baru (`deliver_policy="new"`) pada NATS JetStream, sehingga hanya mendengarkan pesan real-time yang masuk setelah koneksi terbuka. Pastikan ada mekanisme 'heartbeat/ping' berkala pada SSE agar koneksi tidak drop.

3. ENDPOINT HTTP REST (FASTAPI)

- `POST /api/notifications/trigger`: Menerima payload JSON (user_email, sender_name, type, message) untuk mensimulasikan pengiriman notifikasi baru dari sistem atau user lain.
- `GET /api/notifications?user_email=...`: Mengambil list semua notifikasi historis untuk user tersebut dan menghitung total pesan berstatus unread (`unread_count`).
- `PATCH /api/notifications/read-all?user_email=...`: Mengubah semua status notifikasi milik user tersebut di database menjadi `is_read = true` dan mengembalikan nilai unread count menjadi 0.

4. HALAMAN FRONTEND (NEXT.JS 16^ CLIENT COMPONENT)
   Buat halaman khusus notifikasi yang meniru persis komponen UI berikut menggunakan Tailwind CSS:

- Layout Clean Page: Judul besar "Notifikasi" dengan deskripsi dinamis "Anda memiliki X pesan yang belum terbaca."
- Tombol Aksi: Tombol "Tandai Semua Dibaca" di pojok kanan atas yang memicu endpoint PATCH.
- Sistem Tab Filter:
  - Tab "Semua Pesan" dengan badge abu-abu yang menampilkan total seluruh notifikasi.
  - Tab "Belum Terbaca" dengan badge merah menyala yang menampilkan jumlah `unread_count` (berikan efek pulse jika > 0).
- List Card Notifikasi:
  - Jika status belum dibaca (`is_read: false`), berikan border hijau tegas (misal: `border-green-500`) dan background hijau sangat muda (misal: `bg-green-50/40`) agar mencolok seperti indikator pesan baru.
  - Jika sudah dibaca (`is_read: true`), gunakan border abu-abu standar (`border-neutral-200`) dan background putih bersih.
  - Tampilkan tipe notifikasi (cth: "Usulan Disetujui"), nama pengirim di dalam tanda kurung kecil, teks pesan, dan label waktu relatif di sebelah kanan (cth: "1 menit lalu", "2 hari lalu").
  - Berikan batas tinggi maksimal (`max-h`) pada container list dengan scrollbar vertikal yang rapi.
- Integrasi Client-Side SSE: Gunakan `EventSource` di dalam `useEffect` Next.js untuk menangkap notifikasi baru dari FastAPI. Ketika pesan masuk, data langsung didorong ke baris paling atas array state (`[newNotif, ...prev]`) secara instan dan `unreadCount` otomatis bertambah (+1) tanpa reload halaman. Pastikan fungsi cleanup dijalankan (`eventSource.close()`) saat unmount untuk mencegah memory leak.

5. SKRIP SIMULATOR PENGUJIAN (PYTHON CLIENT SCRIPT)
   Buat satu file terpisah bernama `test_sender.py` menggunakan library `requests` untuk menguji fitur ping antar user. Skrip ini berjalan berbasis CLI Interaktif di terminal komputer lokal (bisa dijalankan di luar Docker untuk mensimulasikan hit API eksternal) dengan menu pilihan:

- Opsi 1: Otomatis menembak notifikasi dari "User 1 (Manager)" ke "user2@example.com" dengan tipe "Usulan Disetujui".
- Opsi 2: Otomatis menembak notifikasi dari "User 1 (Reviewer)" ke "user2@example.com" dengan tipe "Usulan Perlu Revisi".
- Opsi 3: Input Manual, di mana tester bisa mengetik secara kustom: Nama Pengirim, Tipe Notifikasi, Isi Pesan, dan Email Penerima.
- Opsi 4: Keluar.

Tolong berikan kode yang bersih (clean code), instruksi cara menjalankan Docker Compose-nya, lengkap dengan penanganan error (try/catch), terstruktur, dan siap pakai tanpa ada bagian logika penting yang dipotong atau disingkat.
