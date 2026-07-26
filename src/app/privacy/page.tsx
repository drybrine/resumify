import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Privacy Policy — CV Builder" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mesh-gradient-bg flex-1 min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl glass-card rounded-3xl p-8 sm:p-12 border border-white/10 space-y-6 text-slate-300 text-sm leading-relaxed">
          <h1 className="text-3xl font-extrabold text-white text-gradient">Kebijakan Privasi (Privacy Policy)</h1>
          <p className="text-xs text-slate-400">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}</p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar akun CV Builder, termasuk alamat email, nama lengkap, dan data resume/CV (riwayat pendidikan, pengalaman kerja, keahlian) yang Anda masukkan ke dalam sistem editor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Penggunaan Informasi</h2>
            <p>Informasi yang dikumpulkan digunakan semata-mata untuk:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Menyediakan layanan pembuat CV dan ekspor PDF.</li>
              <li>Menyimpan draf CV Anda di cloud agar dapat diakses kembali.</li>
              <li>Memproses transaksi pembayaran paket Pro melalui QRIS.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Keamanan Data</h2>
            <p>
              Data Anda disimpan dengan aman menggunakan infrastruktur Supabase dengan enkripsi standar industri dan aturan Row Level Security (RLS) yang ketat. Kami tidak pernah menjual data pribadi Anda kepada pihak ketiga mana pun.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Hak Pengguna</h2>
            <p>
              Anda berhak memperbarui, mengunduh, atau menghapus seluruh data CV dan profil akun Anda kapan saja melalui dashboard aplikasi CV Builder.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}