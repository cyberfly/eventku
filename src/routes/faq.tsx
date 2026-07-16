import { createFileRoute } from '@tanstack/react-router'

const faqItems = [
  {
    question: 'Bagaimana cara mendaftar ke sebuah event?',
    answer:
      'Buka halaman Events, pilih event yang diminati, lalu klik tombol pendaftaran pada halaman detail event untuk menyelesaikan proses booking.',
  },
  {
    question: 'Apakah saya bisa membatalkan tiket yang sudah dibeli?',
    answer:
      'Kebijakan pembatalan berbeda-beda untuk setiap event. Silakan hubungi organizer event terkait melalui informasi kontak pada halaman detail event.',
  },
  {
    question: 'Apa perbedaan format Online dan Offline?',
    answer:
      'Event Online diselenggarakan melalui platform virtual, sedangkan event Offline diadakan langsung di venue fisik. Format ditampilkan pada setiap listing event.',
  },
  {
    question: 'Bagaimana cara menjadi organizer di Eventku?',
    answer:
      'Kunjungi halaman Organizer dan buat akun baru untuk mulai membuat dan mengelola event Anda sendiri.',
  },
  {
    question: 'Metode pembayaran apa saja yang didukung?',
    answer:
      'Detail metode pembayaran yang tersedia akan ditampilkan saat Anda menyelesaikan proses booking pada halaman event.',
  },
]

export const Route = createFileRoute('/faq')({
  component: FaqPage,
})

function FaqPage() {
  return (
    <div className="page-stack">
      <section className="section-banner panel">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>Pertanyaan yang sering diajukan</h2>
        </div>
        <p className="muted-copy">
          Temukan jawaban atas pertanyaan umum seputar pendaftaran event, pembayaran, dan
          bagaimana Eventku bekerja.
        </p>
      </section>

      <div className="faq-list panel">
        {faqItems.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer muted-copy">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
