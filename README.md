# 🔔 Notifikasi Real-time — NATS JetStream + FastAPI + Next.js

> Proyek ini dibuat menggunakan **DeepSeek-v4-flash-free (AI)** sebagai asisten coding, dengan tujuan utama mempelajari implementasi **NATS JetStream** untuk notifikasi real-time dan **Infinite Scroll** pada frontend.

---

## 🧠 Tech Stack

### Backend & Infrastructure

| Teknologi | Fungsi |
|---|---|
| **Python 3.11** | Bahasa pemrograman backend |
| **FastAPI** | Framework REST API + SSE endpoint |
| **NATS JetStream** | Message broker real-time (streaming, persistent consumer) |
| **nats-py** | Python client resmi untuk NATS |
| **sse-starlette** | Server-Sent Events untuk push notifikasi ke browser |
| **Uvicorn** | ASGI server dengan hot-reload |
| **Docker / Compose** | Containerisasi backend + NATS server |

### Frontend

| Teknologi | Fungsi |
|---|---|
| **Next.js 16 (App Router)** | React framework dengan server/client components |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Lucide React** | Icon library |
| **Axios** | HTTP client dengan request/response interceptor |
| **EventSource API** | SSE client bawaan browser |
| **IntersectionObserver / onScroll** | Deteksi scroll untuk infinite loading |

### Arsitektur

```
┌──────────────┐     SSE (EventSource)     ┌──────────────────┐     NATS      ┌──────────────┐
│   Browser    │ ◄──────────────────────►   │  FastAPI Server  │ ◄────────►   │     NATS     │
│  Next.js 16  │                           │   (Bridge)       │   JetStream   │  JetStream   │
│              │     REST API (Axios)       │                  │              │              │
│  /notific-   │ ◄──────────────────────►   │  ┌──────────┐   │              │  Stream:     │
│  ations      │     GET/POST/PATCH         │  │ Mock DB  │   │              │  NOTIFICAT-  │
│              │                           │  │ (memory) │   │              │  IONS        │
└──────────────┘                           └──────────────────┘              └──────────────┘
```

---

## 🎯 Fitur

### Real-time Notifikasi
- Notifikasi dikirim melalui **NATS JetStream** dan diteruskan ke browser via **SSE**
- Setiap notifikasi langsung muncul tanpa reload halaman
- Counter unread otomatis bertambah (+1)

### Infinite Scroll
- Hanya memuat **5 notifikasi per request**
- **Auto-load** otomatis jika konten masih muat tanpa scroll
- **Scroll manual** memicu halaman berikutnya saat mendekati batas bawah
- Indikator loading dan pesan "Semua notifikasi telah dimuat"

### Manajemen Notifikasi
- ✅ **Klik card** → tandai satu notifikasi sebagai terbaca
- ✅ **"Tandai Semua Dibaca"** → satu tombol untuk semua
- ✅ **Tab filter** → "Semua Pesan" / "Belum Terbaca" (dengan badge + pulse)

### REST API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/notifications/trigger` | Kirim notifikasi baru |
| `GET` | `/api/notifications?user_email=&page=&limit=` | List notifikasi (paginasi) |
| `PATCH` | `/api/notifications/{id}/read` | Tandai satu notifikasi dibaca |
| `PATCH` | `/api/notifications/read-all?user_email=` | Tandai semua dibaca |
| `GET` | `/api/notifications/stream?user_email=` | SSE stream (bridge NATS → browser) |

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- Python 3.11 (untuk `test_sender.py` di host)

### 1. Backend + NATS (Docker)

```bash
# Clone & masuk direktori
cd nats-fullstacsk

# Jalankan backend + NATS
docker compose up --build -d

# Cek status
docker compose ps

# Test health
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Buka **http://localhost:3000/notifications**

### 3. Simulator CLI

Di terminal terpisah (host):

```bash
# Kirim notifikasi secara interaktif
python test_sender.py
```

Menu:
1. **User 1 (Manager)** → `user2@example.com` — Usulan Disetujui
2. **User 1 (Reviewer)** → `user2@example.com` — Usulan Perlu Revisi
3. **Input Manual** — Kustom
4. **Keluar**

Atau via curl langsung:

```bash
curl -X POST http://localhost:8000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{"user_email":"user2@example.com","sender_name":"Budi","type":"Pengingat","message":"Meeting jam 10"}'
```

---

## 📁 Struktur Proyek

```
nats-fullstacsk/
├── docker-compose.yml          # Orchestrasi Docker
├── .gitignore
├── README.md
├── test_sender.py              # CLI simulator
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       └── main.py             # FastAPI: REST + SSE + NATS bridge
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── .env.local
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx            # Redirect → /notifications
    │   └── notifications/
    │       └── page.tsx        # Halaman utama notifikasi
    ├── components/
    │   ├── InfiniteScroll.tsx   # Reusable infinite scroll wrapper
    │   └── NotificationCard.tsx # Card notifikasi (click → read)
    └── lib/
        ├── api.ts              # Axios instance + interceptor
        └── utils.ts            # relativeTime, tipe data
```

---

## 🧪 Cara Kerja Infinite Scroll

```
1. Initial load ──── fetchPage(1) ──── 5 notifikasi
       │
2. Auto-load ─────── content masih muat? ──→ fetchPage(2) ──→ +5
       │               tanpa scrollbar
3. Manual scroll ─── scroll ke bawah ──→ onScroll ──→ fetchPage(N)
       │               (jarak < 150px dari bottom)
4. Selesai ───────── notifs.length >= total ──→ "Semua telah dimuat"
```

---

## 🧪 Cara Kerja SSE (Server-Sent Events)

```
  Backend                          NATS JetStream              Frontend
    │                                  │                          │
    │── POST /trigger ──────────────►  │                          │
    │   simpan ke Mock DB             │                          │
    │   publish ke "notif.user.*" ──► │                          │
    │                                  │── push ke consumer ──►  │
    │                                  │                          │── EventSource
    │◄── GET /stream?user_email= ──── │                          │   "notification"
    │   buat Ephemeral Consumer        │                          │   prepend ke list
    │   deliver_policy="new"           │                          │   unreadCount++
    │   heartbeat tiap 30 detik        │                          │
```

---

## 🔒 Catatan Penting

- **Mock Database** bersifat in-memory — data hilang saat container restart
- ID notifikasi menggunakan `int(time.time() * 1_000_000) + counter` untuk menjamin keunikan dan kompatibilitas JavaScript (`< Number.MAX_SAFE_INTEGER`)
- SSE menggunakan **Ephemeral Consumer** — hanya menerima pesan baru setelah koneksi terbuka
- Backend dan frontend **terpisah** (bukan monolith) — frontend tidak perlu NATS client

---

## 📚 Tujuan Pembelajaran

Proyek ini dirancang untuk mempelajari:

1. **NATS JetStream** — Stream, subjek wildcard, ephemeral consumer, deliver policy
2. **Server-Sent Events** — Bridge antara message broker dan browser
3. **Infinite Scroll** — Pagination + IntersectionObserver / onScroll + auto-load
4. **FastAPI** — async handlers, SSE via sse-starlette, error handling
5. **Next.js App Router** — Client components, useEffect lifecycle, SSE integration
6. **Docker Compose** — Multi-service orchestration, healthcheck, volume mount

---

> Dibuat dengan 🧠 oleh **DeepSeek-v4-flash-free (AI)** — Juni 2026
