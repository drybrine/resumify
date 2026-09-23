import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Kebijakan privasi" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Kebijakan privasi"
      updated={new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    >
      <section>
        <h2>1. Data yang dikumpulkan</h2>
        <p>
          Saat mendaftar, kami menyimpan email dan nama yang kamu masukkan. Saat
          mengisi editor, kami menyimpan isi CV-mu: identitas, ringkasan,
          pendidikan, pengalaman, proyek, publikasi, keahlian, dan bahasa.
        </p>
        <p>
          Untuk pembayaran Pro, kami menyimpan nominal, kode referensi, status,
          dan waktu transaksi QRIS. Kami tidak menyimpan nomor kartu, PIN, atau
          kredensial m-banking/e-wallet-mu.
        </p>
      </section>

      <section>
        <h2>2. Cara data dipakai</h2>
        <ul>
          <li>Menampilkan dan menyimpan CV-mu agar bisa dilanjutkan kapan saja.</li>
          <li>Merender PDF yang kamu unduh.</li>
          <li>Memproses dan memverifikasi pembayaran paket Pro.</li>
          <li>
            Menampilkan CV-mu ke publik — hanya jika kamu sendiri mengaktifkan
            link share.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Penyimpanan dan keamanan</h2>
        <p>
          Data disimpan di Supabase (Postgres) dengan Row Level Security: setiap
          baris CV terikat pada akun pembuatnya, sehingga akun lain tidak bisa
          membacanya lewat API. Sesi login dikelola lewat cookie yang hanya bisa
          dibaca di sisi server.
        </p>
      </section>

      <section>
        <h2>4. Yang tidak kami lakukan</h2>
        <p>
          Kami tidak menjual data pribadi, tidak memakai isi CV untuk melatih
          model, dan tidak mengirim email promosi tanpa persetujuanmu.
        </p>
      </section>

      <section>
        <h2>5. Hak kamu</h2>
        <p>
          Kamu bisa memperbarui CV kapan saja dari dasbor, mematikan link publik
          dari editor, dan menghapus CV satu per satu. Untuk penghapusan akun
          beserta seluruh datanya, hubungi admin lewat kontak yang tertera di
          halaman ini.
        </p>
      </section>
    </LegalPage>
  );
}
