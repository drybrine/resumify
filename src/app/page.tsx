import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { HeroShowcase, TemplateGallery } from "@/components/template-showcase";

const SPECS = [
  { k: "Template", v: "20 layout, 2 bisa dipakai di paket gratis" },
  { k: "Ekspor", v: "PDF Letter & A4, dirender di server" },
  { k: "Simpan", v: "Cloud otomatis tiap perubahan" },
  { k: "Bayar", v: "QRIS sekali bayar, tanpa auto-renew" },
];

const STEPS = [
  {
    n: "01",
    title: "Daftar, lalu buat CV kosong",
    body: "Email atau Google. Tidak ada wizard bertele-tele — langsung masuk ke editor dengan form kosong siap diisi.",
  },
  {
    n: "02",
    title: "Isi di kiri, lihat kertasnya di kanan",
    body: "Pratinjau memakai mesin render yang sama dengan PDF, jadi yang kamu lihat di layar persis yang keluar saat diunduh.",
  },
  {
    n: "03",
    title: "Unduh PDF, atau bagikan link",
    body: "PDF dibuat server-side sehingga jarak, font, dan margin konsisten di setiap perangkat. Pengguna Pro bisa mengaktifkan link publik untuk recruiter.",
  },
];

const ATS_POINTS = [
  "Satu kolom, dibaca dari atas ke bawah — urutan teks tidak tertukar.",
  "Heading standar (Experience, Education, Skills) yang dikenali parser.",
  "Teks bisa diseleksi dan disalin; tidak ada teks yang jadi gambar.",
];

const FAQS = [
  {
    q: "Benarkah CV dari sini lolos ATS?",
    a: "Template kategori ATS memakai satu kolom, heading standar, dan teks asli — struktur yang paling aman untuk parser. Yang menentukan hasil akhir tetap isi CV-mu: kata kunci lowongan, angka pencapaian, dan penulisan yang jelas.",
  },
  {
    q: "Gratisnya sampai mana?",
    a: "Paket gratis: 1 CV, template Jake dan Minimal, ekspor PDF, dan penyimpanan cloud. Pro membuka 50 CV, 18 template Pro, dan link share publik.",
  },
  {
    q: "Bagaimana cara bayar Pro?",
    a: "QRIS dinamis: klik bayar, nominal unik muncul (Rp 49.000 + kode), lalu scan dari GoPay, OVO, DANA, ShopeePay, atau m-banking. Setelah terkonfirmasi, Pro aktif 30 hari. Tidak ada penagihan otomatis.",
  },
  {
    q: "Data CV saya aman?",
    a: "CV tersimpan di Supabase dengan Row Level Security — hanya akunmu yang bisa membacanya. Link publik hanya aktif kalau kamu menyalakannya sendiri, dan bisa dimatikan kapan saja.",
  },
  {
    q: "Sudah mengisi data, bisa ganti template?",
    a: "Bisa, kapan saja. Isi CV tetap; hanya layout dan tipografinya yang berubah. Template Pro terkunci sampai kamu upgrade, tapi data tetap utuh.",
  },
];

/** Stagger offset for the CSS-driven `.enter-*` classes. */
const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero — asymmetric: argument on the left, the actual product on the right.
            Above the fold, so the entrance is CSS-only and plays at first paint. */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
              <div className="lg:pt-2">
                <p className="micro enter" style={at(0)}>
                  CV · ATS · Indonesia
                </p>

                <h1
                  className="enter mt-5 text-[38px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]"
                  style={at(70)}
                >
                  CV rapi satu halaman, siap dikirim hari ini.
                </h1>

                <p
                  className="enter mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2"
                  style={at(150)}
                >
                  Isi di kiri, kertasnya tampil di kanan — dengan tipografi yang
                  sama persis seperti PDF-nya. Ada 20 template siap pakai, isi
                  tersimpan otomatis, dan PDF-nya dirender di server.
                </p>

                <div
                  className="enter mt-8 flex flex-wrap items-center gap-3"
                  style={at(220)}
                >
                  <Link href="/signup">
                    <Button size="lg">Bikin CV gratis →</Button>
                  </Link>
                  <Link href="#template">
                    <Button size="lg" variant="secondary">
                      Lihat 20 template
                    </Button>
                  </Link>
                </div>

                <p
                  className="enter mt-6 max-w-xl text-[12px] leading-relaxed text-ink-3"
                  style={at(290)}
                >
                  Gratis untuk 1 CV · tanpa kartu kredit · Pro Rp 49.000 sekali
                  bayar lewat QRIS, tanpa langganan otomatis.
                </p>
              </div>

              <div className="min-w-0 lg:max-w-[490px] lg:justify-self-end">
                <div className="enter-sheet" style={at(160)}>
                  <HeroShowcase />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spec strip — plain facts, not monument numbers */}
        <section className="border-b border-rule bg-sheet">
          <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-x-10 gap-y-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {SPECS.map((s, i) => (
              <Reveal key={s.k} delay={i * 70} rise="8px">
                <dt className="micro">{s.k}</dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                  {s.v}
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* How it works — numbered editorial rows, hairline separated */}
        <section id="cara-kerja" className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
              <Reveal>
                <p className="micro">Cara kerja</p>
                <h2 className="mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                  Tiga langkah, tanpa bagian yang tidak perlu.
                </h2>
              </Reveal>

              <ol className="divide-y divide-rule border-t border-rule">
                {STEPS.map((step, i) => (
                  <Reveal
                    key={step.n}
                    as="li"
                    delay={i * 110}
                    className="grid gap-3 py-6 sm:grid-cols-[64px_1fr] sm:gap-6"
                  >
                    <span className="micro num pt-1 text-[12px]">{step.n}</span>
                    <div>
                      <h3 className="font-display text-[20px] text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
                        {step.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ATS explainer — honest, two columns */}
        <section id="ats" className="border-b border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
              <Reveal>
                <p className="micro">Soal ATS</p>
                <h2 className="mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                  Kenapa layout satu kolom lebih aman.
                </h2>
              </Reveal>

              <div>
                <Reveal delay={80}>
                  <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
                    ATS membaca CV sebagai urutan teks, bukan sebagai tampilan.
                    Begitu ada dua kolom, tabel, atau teks di dalam gambar,
                    urutan bacanya bisa kacau: pengalaman kerja terbaca sebelum
                    nama, atau judul terbaca menyatu dengan isi kolom
                    sebelahnya.
                  </p>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                    Template kategori ATS di Resumify menghindari semua itu, dan
                    template kreatif tetap tersedia untuk kiriman langsung ke
                    manusia.
                  </p>
                </Reveal>

                <ul className="mt-8 space-y-4">
                  {ATS_POINTS.map((point, i) => (
                    <Reveal
                      key={point}
                      as="li"
                      delay={160 + i * 110}
                      rise="8px"
                      className="flex gap-3 border-t border-rule pt-4 text-[14px] leading-relaxed text-ink"
                    >
                      <span
                        aria-hidden
                        className="rule-draw mt-2 h-px w-4 shrink-0 bg-accent"
                        style={{ "--rule-delay": `${320 + i * 110}ms` } as React.CSSProperties}
                      />
                      {point}
                    </Reveal>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Template gallery — real renders, each sheet settling in turn */}
        <section id="template" className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <Reveal className="max-w-2xl">
              <p className="micro">20 template</p>
              <h2 className="mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                Semuanya ditampilkan apa adanya.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
                Ini hasil render asli dari setiap template — bukan gambar contoh.
                Klik salah satu nama di bagian atas untuk mencobanya lebih besar.
              </p>
            </Reveal>

            <div className="mt-12">
              <TemplateGallery />
            </div>
          </div>
        </section>

        {/* Pricing summary */}
        <section className="border-b border-rule bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
              <Reveal>
                <p className="micro">Harga</p>
                <h2 className="mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                  Gratis untuk mencoba. Pro saat lamaranmu banyak.
                </h2>
                <Link
                  href="/pricing"
                  className="link-rule mt-6 inline-block text-[14px] text-ink"
                >
                  Bandingkan lengkap di halaman harga
                </Link>
              </Reveal>

              <div className="grid gap-6 sm:grid-cols-2">
                <Reveal delay={90} rise="8px">
                  <div className="border-t-2 border-rule-strong pt-5">
                    <p className="micro">Free</p>
                    <p className="font-display mt-3 text-[32px] text-ink">Rp 0</p>
                    <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
                      <li>1 CV</li>
                      <li>Template Jake &amp; Minimal</li>
                      <li>Ekspor PDF</li>
                      <li>Simpan cloud</li>
                    </ul>
                  </div>
                </Reveal>

                <Reveal delay={180} rise="8px">
                  <div className="border-t-2 border-accent pt-5">
                    <p className="micro text-accent">Pro · 30 hari</p>
                    <p className="font-display num mt-3 text-[32px] text-ink">
                      Rp 49.000
                    </p>
                    <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
                      <li>50 CV</li>
                      <li>20 template</li>
                      <li>Link share publik</li>
                      <li>Bayar sekali via QRIS</li>
                    </ul>
                    <Link href="/pricing" className="mt-5 inline-block">
                      <Button variant="secondary" size="sm">
                        Pilih Pro
                      </Button>
                    </Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
              <Reveal>
                <p className="micro">Tanya jawab</p>
                <h2 className="mt-4 text-[30px] leading-[1.1] text-ink sm:text-[38px]">
                  Yang biasanya ditanyakan.
                </h2>
              </Reveal>

              <div className="border-t border-rule">
                {FAQS.map((item, i) => (
                  <Reveal
                    key={item.q}
                    delay={i * 80}
                    rise="8px"
                    className="border-b border-rule"
                  >
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] text-ink marker:content-none">
                        {item.q}
                        <span
                          aria-hidden
                          className="text-ink-3 transition-transform duration-300 ease-print group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="max-w-2xl pb-6 text-[14px] leading-relaxed text-ink-2">
                        {item.a}
                      </p>
                    </details>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing poster — ink band */}
        <section className="bg-ink text-sheet">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-20">
            <Reveal className="max-w-2xl">
              <p className="micro text-rule-strong">Mulai sekarang</p>
              <h2 className="mt-4 text-[32px] leading-[1.08] text-sheet sm:text-[44px]">
                Mulai dari CV kosong, keluar dengan PDF yang layak dikirim.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-[color:var(--color-rule-strong)]">
                Butuh sekitar sepuluh menit untuk CV pertamamu. Tidak ada
                pertanyaan-pertanyaan yang harus dilewati dulu.
              </p>
            </Reveal>
            <Reveal delay={120} className="flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button size="lg" variant="primary">
                  Daftar &amp; bikin CV
                </Button>
              </Link>
              <Link
                href="/pricing"
                className="text-[14px] text-sheet underline decoration-[color:var(--color-rule-strong)] underline-offset-4 transition-colors hover:decoration-sheet"
              >
                Lihat harga Pro
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
