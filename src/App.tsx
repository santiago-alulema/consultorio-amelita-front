import { Navigate, Route, Routes } from 'react-router-dom';
import GlobalLoading from './components/GlobalLoading';
import AppLayout from './layouts/AppLayout';
import AgendaPage from './pages/AgendaPage';
import CajaPage from './pages/CajaPage';
import ConsultasPage from './pages/ConsultasPage';
import DashboardPage from './pages/DashboardPage';
import HistoriasClinicasPage from './pages/HistoriasClinicasPage';
import InventarioPage from './pages/InventarioPage';
import LoginPage from './pages/LoginPage';
import PacientesPage from './pages/PacientesPage';
import PedidosPage from './pages/PedidosPage';
import ProductosPage from './pages/ProductosPage';
import RecetasPage from './pages/RecetasPage';
import ReportesPage from './pages/ReportesPage';
import SriPage from './pages/SriPage';
import UsuariosPage from './pages/UsuariosPage';
import VentasPage from './pages/VentasPage';

function Protected() {
    return localStorage.getItem('token')
        ? <AppLayout />
        : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <>
            <GlobalLoading />

            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<Protected />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/pacientes" element={<PacientesPage />} />
                    <Route path="/historias" element={<HistoriasClinicasPage />} />
                    <Route path="/consultas" element={<ConsultasPage />} />
                    <Route path="/recetas" element={<RecetasPage />} />
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    <Route path="/ventas" element={<VentasPage />} />
                    <Route path="/pedidos" element={<PedidosPage />} />
                    <Route path="/sri" element={<SriPage />} />
                    <Route path="/caja" element={<CajaPage />} />
                    <Route path="/reportes" element={<ReportesPage />} />
                    <Route path="/usuarios" element={<UsuariosPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
