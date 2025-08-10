// File: src/pages/HomePage.jsx (LENGKAP & DIPERBAIKI)

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation"; 
import logo from "../assets/logo.png";
import axios from "axios";

// Impor gambar untuk slider hero
import heroImg1 from "../assets/MCO.jpg";
import heroImg2 from "../assets/Bekam Kering.jpg";
import heroImg3 from "../assets/Full Body Massage.jpg";

// Buat instance axios dengan baseURL agar lebih mudah dikelola
const axiosInstance = axios.create({
  baseURL: '/api' // Mengandalkan proxy
});

export default function HomePage() {
  const [cabangs, setCabangs] = useState([]);
  const [pakets, setPakets] = useState([]);
  const [terapis, setTerapis] = useState([]);
  const BASE_IMAGE_URL = "/assets";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCabang, resPaket, resTerapis] = await Promise.all([
          axiosInstance.get("/cabang"),
          axiosInstance.get("/paket"),
          axiosInstance.get("/terapis"),
        ]);
        setCabangs(resCabang.data.data || []);
        setPakets(resPaket.data.data || []);
        setTerapis(resTerapis.data.data || []);
      } catch (error) {
        console.error("Gagal memuat data homepage:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {/* Navbar */}
      <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="MR MASSAGE" style={{ height: 32 }} />
            <Link className="navbar-brand fw-bold fs-4 mb-0" to="/">MR Massage</Link>
          </div>
          <div className="d-flex gap-4 align-items-center">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/jadwal">Jadwal</Link>
            <Link to="/signin" className="btn btn-primary px-4">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-3">Apa itu MR Massage?</h1>
              <p className="text-muted fs-5">
                Mentari Ria Husada Massage Cimahi, atau lebih dikenal sebagai MR Massage, merupakan fasilitas kesehatan pijat tradisional. MR Massage kini berfokus pada penanganan cedera dengan dua cabang aktif: Sarijadi dan Soreang.
              </p>
            </div>
            <div className="col-md-4 ps-md-5">
              <Swiper
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                initialSlide={1}
                loop={true}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                coverflowEffect={{ rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true }}
                modules={[EffectCoverflow, Autoplay]}
                className="mySwiper"
              >
                {[heroImg1, heroImg2, heroImg3].map((src, i) => (
                  <SwiperSlide key={i} style={{ width: '250px', height: '300px' }}>
                    <img src={src} alt={`Kegiatan ${i + 1}`} style={{ height: "100%", width: '100%', objectFit: "cover", borderRadius: "12px" }}/>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* Cabang Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Lokasi Cabang</h2>
          <div className="row g-4">
            {cabangs.map((cabang) => {
              const link_gmaps =
                cabang.id_cabang === "01" ? "https://maps.app.goo.gl/g3YSojc3PEdX6Nex9" :
                cabang.id_cabang === "02" ? "https://maps.app.goo.gl/3gjuEeZzw88TQeBP7" : "#";
              return (
                <div className="col-md-6" key={cabang.id_cabang}>
                  <a href={link_gmaps} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="card shadow-sm h-100 d-flex flex-row align-items-stretch" style={{ minHeight: 180 }}>
                      <div className="card-body d-flex flex-column justify-content-center" style={{ flex: "2 1 0" }}>
                        <h5 className="card-title">{cabang.nama_cabang}</h5>
                        <p className="card-text">{cabang.alamat_cabang}</p>
                      </div>
                      <div style={{ flex: "1 1 0", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cabang.foto_cabang && (
                          <img src={`${BASE_IMAGE_URL}/cabang/${cabang.foto_cabang}`} alt={cabang.nama_cabang} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.5rem" }} />
                        )}
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Paket Layanan Section */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="text-center mb-4">Paket Layanan</h2>
          <Swiper
            spaceBetween={16}
            slidesPerView={1.2}
            breakpoints={{ 576: { slidesPerView: 2.2 }, 768: { slidesPerView: 3.2 } }}
            pagination={{ clickable: true }}
            loop={pakets.length > 3}
            navigation={true}
            modules={[Pagination, Navigation]}
          >
            {pakets.map((paket) => (
              <SwiperSlide key={paket.id_paket}>
                <div className="card h-100 shadow-sm">
                  {paket.gambar_paket && (
                    <img src={`${BASE_IMAGE_URL}/paket/${paket.gambar_paket}`} className="card-img-top" alt={paket.nama_paket} style={{ objectFit: "cover", height: 180 }} />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{paket.nama_paket}</h5>
                    <p className="mb-1"><strong>Durasi:</strong> {paket.durasi_paket} menit</p>
                    <p className="card-text text-muted">{paket.deskripsi_paket}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Terapis Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Terapis Kami</h2>
          <div className="d-flex flex-wrap justify-content-center gap-4">
            {terapis.map((t) => {
              // PERBAIKAN: Gunakan `gender_terapis`
              const bgColor = t.gender_terapis === "L" ? "#e0f3ff" : "#ffe6f0";
              
              // PERBAIKAN: Akses data cabang dan keahlian dari properti yang benar
              const cabangAktif = t.cabang?.[0]; // Cabang pertama adalah yang terbaru
              const daftarKeahlian = t.keahlian_full || [];

              return (
                <div key={t.id_terapis} style={{ width: "200px" }}>
                  <div className="card shadow-sm h-100 border-0">
                    <div style={{ padding: '15px', backgroundColor: bgColor, borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem" }}>
                      {t.foto_terapis && (
                        <img src={`${BASE_IMAGE_URL}/terapis/${t.foto_terapis}`} alt={t.nama_terapis} style={{ height: 220, width: "100%", objectFit: "cover", borderRadius: "0.375rem" }} />
                      )}
                    </div>
                    <div className="card-body" style={{ backgroundColor: bgColor, borderBottomLeftRadius: "0.5rem", borderBottomRightRadius: "0.5rem" }}>
                      <h5 className="card-title fw-bold">{t.nama_terapis} ({t.inisial_terapis})</h5>
                      
                      {/* PERBAIKAN: Tampilkan nama cabang dengan benar */}
                      <p className="card-text mb-2">
                        <strong>Cabang:</strong> {cabangAktif?.nama_cabang || '-'}
                      </p>
                      
                      {/* PERBAIKAN: Render daftar keahlian dengan benar */}
                      {daftarKeahlian.length > 0 && (
                        <div>
                          <p className="card-text mb-1"><strong>Keahlian:</strong></p>
                          <ul className="mb-0 ps-3">
                            {daftarKeahlian.map((k) => (
                              <li key={k.id_keahlian}>{k.nama_keahlian}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-4 mt-5">
        <div className="container text-center">
          <h5 className="mb-2">MR Massage</h5>
          <p className="mt-2 mb-0">© {new Date().getFullYear()} MR Massage x KoTA 102</p>
        </div>
      </footer>
    </>
  );
}