import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layout
import MainLayout from "./components/MainLayout";

// Halaman publik
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";

// Admin pages
import HargaPaket from './pages/Admin/HargaPaket';
import JamKerja from './pages/Admin/JamKerjaPage';
import Presensi from './pages/Admin/Presensi';
import Pemesanan from './pages/Admin/Pemesanan';
import Pasien from './pages/Admin/Pasien';
import TransaksiHarian from './pages/Admin/TransaksiHarian';
import TransaksiHarianDetail from './pages/Admin/TransaksiHarianDetail';

// Superadmin pages
import AkunAdmin from './pages/Super Admin/AkunAdmin';
import Terapis from './pages/Super Admin/Terapis';
import SifSesi from './pages/Super Admin/SifSesi';
import CabangRuangan from './pages/Super Admin/CabangRuangan';
import PaketLayanan from './pages/Super Admin/PaketLayanan';

function ProtectedRoute({ children }) {
  const { role, loading } = useAuth();

  if (loading) return null; // atau loader

  if (!role) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const { role } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Superadmin */}
        <Route path="akun-admin" element={<AkunAdmin />} />
        <Route path="terapis" element={<Terapis />} />
        <Route path="sif-sesi" element={<SifSesi />} />
        <Route path="paket" element={<PaketLayanan />} />
        <Route path="cabang-ruangan" element={<CabangRuangan />} />

        {/* Admin */}
        <Route path="harga-paket" element={<HargaPaket />} />
        <Route path="jam-kerja" element={<JamKerja />} />
        <Route path="presensi" element={<Presensi />} />
        <Route path="pemesanan" element={<Pemesanan />} />
        <Route path="pasien" element={<Pasien />} />
        <Route path="transaksi-harian" element={<TransaksiHarian />} />
        <Route path="transaksi-harian/detail/:id_pesanan" element={<TransaksiHarianDetail />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
