# CV Builder SaaS

Next.js 16 + Supabase + **QRIS (Indonesia)**. ATS resume builder with multi-CV cloud save, templates, PDF export, share links, billing, admin.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4)
- **Supabase** — Auth (email + Google), Postgres, RLS
- **QRIS dinamis** — `@shamah/dynamic-qris` (static → dynamic) + `qrcode`
- **Puppeteer / @sparticuz/chromium** — server PDF

## Features

| Feature | Free | Pro (Rp 49.000 / 30 hari) |
|--------|------|-----|
| CVs | 1 | 50 |
| Templates | Jake, Minimal | Jake, Modern, Compact, Elegant, Sidebar, Corporate, Tech, Harvard, Executive, Creative, Terminal, Swiss, Scholar, Timeline, Mono, Atlas, Editorial, Orbit, Mono Grid |
| PDF export | ✓ | ✓ |
| Share link | — | ✓ |
| Cloud save | ✓ | ✓ |
| Bayar | — | QRIS e-wallet / m-banking |

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste & run `supabase/schema.sql`
3. **Authentication → Providers** → enable Email + Google
4. **URL config** → add `http://localhost:3000/auth/callback`
5. Copy Project URL + anon key + service role key → `.env.local`

### 3. Make yourself admin (optional)

```sql
update public.profiles set is_admin = true, plan = 'admin'
where email = 'you@email.com';
```

### 4. QRIS (Indonesia)

1. Ambil **QRIS statis** merchant (GoBiz / Dana Business / bank).
2. Decode jadi string payload (mulai `000201…` berakhir CRC `6304XXXX`).
3. Paste ke `.env.local`:
   ```
   QRIS_STATIC_PAYLOAD=00020101021126...6304XXXX
   ```
4. Library: **`@shamah/dynamic-qris`** inject nominal + ref + CRC baru.
5. Flow bayar:
   - User klik **Bayar QRIS** → nominal unik = `49000 + XXX` (kode match mutasi)
   - Scan e-wallet / m-banking
   - Admin buka `/admin` → **Konfirmasi** → plan Pro 30 hari

> Catatan: tanpa integrasi mutasi rekening, konfirmasi bayar **manual admin**.
> Nanti bisa auto-match nominal via mutasi BCA/Flip/dll.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/login` `/signup` | Auth |
| `/dashboard` | Multi-CV list |
| `/editor/[id]` | Live editor |
| `/share/[slug]` | Public CV |
| `/pricing` | Free / Pro + QRIS checkout |
| `/admin` | Users + konfirmasi QRIS |
| `/api/cvs/[id]/pdf` | PDF download |
| `/api/payments/create` | Buat invoice + QRIS dinamis |
| `/api/payments/status` | Cek status bayar |

## PDF notes

- **Vercel**: uses `@sparticuz/chromium` + `puppeteer-core`
- **Local**: set `PUPPETEER_EXECUTABLE_PATH` to Chrome/Chromium, or install Chrome at default path
- If Chromium missing, API returns 503 — use browser Print as fallback

## Legacy static app

Original vanilla HTML/JS version lives in `legacy/`.

## License

Private / your product.
