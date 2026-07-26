import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Terms of Service — CV Builder" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mesh-gradient-bg flex-1 min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass-card rounded-3xl p-8 sm:p-12 border border-white/10 space-y-6 text-slate-300 text-sm leading-relaxed">
          <h1 className="text-3xl font-extrabold text-white text-gradient">Syarat & Ketentuan (Terms of Service)</h1>
          <p className="text-xs text-slate-400">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Ketentuan Layanan</h2>
            <p>
              Dengan mendaftar dan menggunakan platform CV Builder, Anda menyetujui untuk mematuhi seluruh syarat dan ketentuan yang berlaku dalam penggunaan layanan ini.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Akun & Paket Langganan</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Paket Free:</strong> Mendapatkan akses gratis untuk membuat 1 CV dengan template dasar.</li>
              <li><strong>Paket Pro:</strong> Membuka hingga 50 CV, seluruh template profesional, dan fitur tautan publik.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Pembayaran QRIS & Pengembalian Dana</h2>
            <p>
              Pembayaran paket Pro dilakukan secara manual/instan melalui transfer QRIS dengan nominal presisi. Setelah pembayaran dikonfirmasi oleh admin, status akun Pro akan aktif secara otomatis selama 30 hari. Pembayaran yang sudah berhasil tidak dapat dikembalikan (non-refundable).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Hak Cipta & Kepemilikan Data</h2>
            <p>
              Seluruh hak cipta atas konten resume/CV yang dibuat berada sepenuhnya di tangan pengguna. CV Builder hanya bertindak sebagai platform penyedia alat bantu pembuatan.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}