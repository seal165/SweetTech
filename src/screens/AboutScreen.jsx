// src/screens/AboutScreen.jsx
import { Link } from 'react-router-dom';

export default function AboutScreen() {
  // CSS asli dari about.html tetap utuh dan diisolasi di dalam komponen ini
  const styles = `
    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --pink-accent: #f8c1d2;
      --pink-hover: #f19fb5;
      --text-muted: #7d6f73;
      --border-color: #ebe4e6;
      --whatsapp-color: #25D366;
      --whatsapp-hover: #20ba5a;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }

    body {
      background-color: var(--bg-color);
      color: var(--primary-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
      align-self: center;
    }

    /* --- NAVBAR --- */
    header {
      padding: 1.5rem 0;
      background-color: #fcfaf8;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--brand-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo i { color: #ea6c75; }

    .nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.3s;
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--brand-color);
      font-weight: 600;
    }

    .nav-icons {
      display: flex;
      gap: 1.5rem;
      font-size: 1.2rem;
    }

    .nav-icons a {
      color: var(--primary-text);
      text-decoration: none;
    }

    /* --- ABOUT CONTENT --- */
    .about-section {
      margin: 4rem 0 6rem;
      opacity: 0;
      transform: translateY(15px);
      animation: fadeInUp 0.5s ease forwards;
    }

    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }

    .story-block {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 4rem;
      align-items: center;
      margin-bottom: 5rem;
    }

    .story-img {
      width: 100%;
      height: 400px;
      border-radius: 20px;
      object-fit: cover;
      box-shadow: 0 8px 25px rgba(112, 68, 85, 0.03);
      border: 1px solid var(--border-color);
    }

    .story-text h1 {
      font-size: 2.4rem;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }

    .story-text h1 span {
      color: var(--brand-color);
    }

    .story-text p {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }

    /* Section Title Extension */
    .section-title {
      text-align: center;
      margin: 5rem 0 2rem;
      font-size: 1.8rem;
      color: #1a1a1a;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      display: block;
      width: 50px;
      height: 3px;
      background-color: var(--brand-color);
      margin: 0.5rem auto 0;
      border-radius: 2px;
    }

    /* Visi Misi Cards */
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .value-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      text-align: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .value-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(112, 68, 85, 0.04);
    }

    .value-icon {
      width: 60px;
      height: 60px;
      background-color: #f7ebee;
      color: var(--brand-color);
      font-size: 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .value-card h3 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #1a1a1a;
    }

    .value-card p {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Misi List Styling */
    .misi-list {
      text-align: left;
      padding-left: 1rem;
    }
    .misi-list li {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* --- CONTACT SECTION (NEW WA INTEGRATION) --- */
    .contact-container {
      max-width: 600px;
      margin: 2rem auto 0;
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 8px 25px rgba(112, 68, 85, 0.02);
    }

    .contact-container p {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .wa-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background-color: var(--whatsapp-color);
      color: #ffffff;
      text-decoration: none;
      padding: 1rem 2.5rem;
      font-weight: 600;
      font-size: 1.05rem;
      border-radius: 50px;
      transition: background-color 0.3s, transform 0.2s;
      box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
    }

    .wa-btn:hover {
      background-color: var(--whatsapp-hover);
      transform: scale(1.02);
    }

    .info-meta {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .info-meta span i {
      color: var(--brand-color);
      margin-right: 0.4rem;
    }

    /* --- FOOTER --- */
    footer {
      background-color: #f4efed;
      padding: 2.5rem 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: auto;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    /* Responsive */
    @media (max-width: 850px) {
      .story-block { grid-template-columns: 1fr; gap: 2rem; }
      .story-img { height: 280px; }
      .info-meta { flex-direction: column; gap: 0.75rem; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      
      <header>
        <div className="container navbar">
          <Link to="/" className="logo">
            <i className="fa-solid fa-cake-candles"></i> SweetTech
          </Link>
          
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/about" className="active">About Us</Link>
          </nav>

          <div className="nav-icons">
            <Link to="/cart"><i className="fa-solid fa-cart-shopping"></i></Link>
            <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
          </div>
        </div>
      </header>

      <main className="container about-section">
        {/* Cerita Utama */}
        <div className="story-block">
          <img 
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80" 
            alt="SweetTech Kitchen" 
            className="story-img"
          />
          <div className="story-text">
            <h1>Kisah Manis Di Balik <span>SweetTech</span></h1>
            <p>Didirikan pada tahun 2024, SweetTech lahir dari kecintaan mendalam kami terhadap seni hidangan penutup modern. Kami believe bahwa setiap perayaan kehidupan—besar maupun kecil—pantas dirayakan dengan rasa manis yang sempurna.</p>
            <p>Kami memadukan teknik pembuatan kue tradisional Italia dan Prancis dengan teknologi pemesanan modern untuk memastikan hidangan panna cotta dan dessert box premium kami tiba di tangan Anda dalam kondisi sesegar dan selezat mungkin.</p>
          </div>
        </div>

        {/* Visi & Misi */}
        <h2 className="section-title">Visi & Misi</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon"><i className="fa-regular fa-eye"></i></div>
            <h3>Visi Kami</h3>
            <p>Menjadi platform andalan utama para pecinta hidangan pencuci mulut premium, menghantarkan kebahagiaan manis di setiap suapan ke seluruh penjuru kota melalui inovasi digital.</p>
          </div>

          <div className="value-card">
            <div className="value-icon"><i className="fa-solid fa-bullseye"></i></div>
            <h3>Misi Kami</h3>
            <ul className="misi-list">
              <li>Menyajikan hidangan penutup berkualitas tinggi yang dibuat secara higienis dan fresh setiap hari.</li>
              <li>Mengintegrasikan teknologi web yang intuitif guna mempermudah akses pemesanan pelanggan.</li>
              <li>Memberikan pelayanan operasional dan pengiriman yang cepat serta terpercaya.</li>
            </ul>
          </div>
        </div>

        {/* Keunggulan Produk */}
        <h2 className="section-title">Mengapa Memilih Kami?</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon"><i className="fa-solid fa-seedling"></i></div>
            <h3>Bahan Alami Premium</h3>
            <p>Kami berkomitmen 100% hanya menggunakan vanilla asli, buah beri segar, serta cokelat Belgia terbaik tanpa bahan pengawet kimia apa pun.</p>
          </div>

          <div className="value-card">
            <div className="value-icon"><i className="fa-solid fa-utensils"></i></div>
            <h3>Seni & Presisi</h3>
            <p>Setiap layer Panna Cotta dan susunan Dessert Box diproses dengan detail estetika yang tinggi untuk memanjakan mata dan lidah Anda.</p>
          </div>

          <div className="value-card">
            <div className="value-icon"><i className="fa-solid fa-truck-fast"></i></div>
            <h3>Sistem Pengiriman Aman</h3>
            <p>Dikemas menggunakan kemasan khusus standar pangan terlindung yang menjaga suhu dessert tetap dingin hingga ke alamat tujuan.</p>
          </div>
        </div>

        {/* Hubungi Kami / Integrasi WhatsApp */}
        <h2 className="section-title">Hubungi Kami</h2>
        <div className="contact-container">
          <p>Punya pertanyaan seputar kustomisasi menu, pesanan acara besar, atau kendala dalam pengiriman? Tim Customer Service kami siap melayani dan menjawab kebutuhan manis Anda dengan senang hati.</p>
          
          <a 
            href="https://wa.me/6289651588072?text=Halo%20SweetTech,%20saya%20ingin%20bertanya%20mengenai%20menu%20dessert" 
            className="wa-btn" 
            target="_blank" 
            rel="noreferrer"
          >
            <i className="fa-brands fa-whatsapp"></i> Chat via WhatsApp
          </a>

          <div className="info-meta">
            <span><i className="fa-regular fa-clock"></i> Jam Operasional: 09.00 - 21.00 WIB</span>
            <span><i className="fa-solid fa-location-dot"></i> Batu, Jawa Timur</span>
          </div>
        </div>
      </main>

      <footer>
        <div className="container footer-content">
          <span>© 2026 SweetTech. All rights reserved.</span>
          <span>Premium Dessert Shop</span>
        </div>
      </footer>
    </>
  );
}