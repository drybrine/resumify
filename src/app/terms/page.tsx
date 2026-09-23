import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Syarat penggunaan" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Syarat penggunaan"
      updated={new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    >
      <section>
        <h2>1. Layanan</h2>
        <p>
          Resumify adalah alat bantu penyusunan CV: editor dengan pratinjau
          langsung, kumpulan template, ekspor PDF, dan penyimpanan cloud. Dengan
          membuat akun, kamu setuju memakai layanan ini untuk keperluan yang sah.
        </p>
      </section>

      <section>
        <h2>2. Paket dan batas pemakaian</h2>
        <ul>
          <li>
            <strong>Free:</strong> 1 CV, template Jake dan Minimal, ekspor PDF,
            dan penyimpanan cloud.
          </li>
          <li>
            <strong>Pro:</strong> sampai 50 CV, seluruh template, dan link share
            publik, aktif selama 30 hari sejak pembayaran dikonfirmasi.
          </li>
        </ul>
        <p>
          Paket Pro tidak diperpanjang otomatis. Setelah masa aktif selesai,
          akunmu kembali ke batas Free — CV yang sudah ada tidak dihapus, tetapi
          fitur Pro tidak lagi bisa dipakai sampai kamu membayar lagi.
        </p>
      </section>

      <section>
        <h2>3. Pembayaran QRIS</h2>
        <p>
          Pembayaran dilakukan lewat QRIS dengan nominal unik (harga + kode
          pencocokan). Pastikan nominal transfer sama persis; nominal yang
          berbeda bisa memperlambat verifikasi. Konfirmasi dilakukan otomatis
          bila mutasi terhubung, atau manual oleh admin bila belum.
        </p>
        <p>
          Pembayaran yang sudah dikonfirmasi tidak dapat dikembalikan. Jika
          terjadi kegagalan teknis yang membuat Pro tidak aktif, hubungi admin
          untuk penyelesaian.
        </p>
      </section>

      <section>
        <h2>4. Isi CV dan hak cipta</h2>
        <p>
          Seluruh isi CV yang kamu tulis tetap milikmu. Kami hanya menyimpannya
          untuk keperluan layanan, dan tidak mengklaim hak apa pun atas isinya.
          Kamu bertanggung jawab memastikan isi CV tidak melanggar hak pihak lain.
        </p>
      </section>

      <section>
        <h2>5. Batasan tanggung jawab</h2>
        <p>
          Kami tidak menjamin CV yang dibuat akan diterima pada proses rekrutmen
          tertentu. Template kategori ATS disusun agar ramah terhadap sistem
          parsing, tetapi hasil akhir tetap bergantung pada isi CV dan kebutuhan
          perekrut.
        </p>
      </section>
    </LegalPage>
  );
}
