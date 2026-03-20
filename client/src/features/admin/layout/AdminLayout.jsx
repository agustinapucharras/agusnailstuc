import { useState } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import '../admin.css'; // Ensure this assumes admin.css is in the parent directory as per file structure

const NavItem = ({ to, label, icon, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname.includes(to);
    return (
        <Link
            to={`/admin${to}`}
            className={`admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            <span className="admin-nav-icon">{icon}</span>
            {label}
        </Link>
    );
};

const AdminLayout = () => {
    const { user, isAuthenticated } = useAuthStore();
    
    if (!isAuthenticated) {
        // Security Check
        return <Navigate to="/admin" replace />;
    }

    // Check if user is admin OR if employee has admin role
    const isAdmin = user?.userType === 'admin' || user?.role === 'admin';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="admin-layout-container">
            {/* Mobile Header */}
            <header className="admin-mobile-header">
                <button className="admin-hamburger-btn" onClick={toggleMobileMenu}>
                    <span className="material-symbols-rounded">menu</span>
                </button>
                <span className="admin-mobile-title">Panel {isAdmin ? 'Admin' : 'Empleado'}</span>
            </header>

            {/* Overlay for mobile */}
            <div
                className={`admin-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <h1 className="admin-sidebar-title">Panel {isAdmin ? 'Administrador' : 'Empleado'}</h1>
                    <p className="admin-sidebar-subtitle">Sistema de Turnos</p>
                    <button className="admin-close-sidebar-btn" onClick={closeMobileMenu}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <nav className="admin-nav">
                    <NavItem to="/dashboard" label="Dashboard" icon={<span className="material-symbols-rounded">dashboard</span>} onClick={closeMobileMenu} />
                    <NavItem to="/agenda" label="Agenda" icon={<span className="material-symbols-rounded">calendar_month</span>} onClick={closeMobileMenu} />

                    {/* Solo mostrar estas opciones a administradores */}
                    {isAdmin && (
                        <>
                            <div className="admin-nav-divider"></div>
                            <div className="admin-nav-section-title">Gestión</div>

                            <NavItem to="/services" label="Servicios" icon={<span className="material-symbols-rounded">description</span>} onClick={closeMobileMenu} />
                            <NavItem to="/clients" label="Clientes" icon={<span className="material-symbols-rounded">groups</span>} onClick={closeMobileMenu} />
                            <NavItem to="/staff" label="Personal" icon={<span className="material-symbols-rounded">badge</span>} onClick={closeMobileMenu} />

                            <div className="admin-nav-divider"></div>
                            {/* <div className="admin-nav-section-title">Configuración</div> */}

                            {/* <NavItem to="/notifications" label="Notificaciones" icon={<span className="material-symbols-rounded">mail</span>} onClick={closeMobileMenu} /> */}
                        </>
                    )}

                </nav>

                <div className="admin-sidebar-footer">
                    {/* Indicador de Usuario Activo */}
                    {user && (
                        <div className="admin-user-info">
                            {/* Círculo verde de estado activo */}
                            <div className="admin-status-dot"></div>

                            {/* Información del usuario */}
                            <div className="admin-user-details">
                                <div className="admin-username">
                                    {user.username || user.name}
                                </div>
                                <div className="admin-user-role">
                                    {isAdmin ? 'Administrador' : 'Empleado'}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => { useAuthStore.getState().logout(); window.location.href = '/admin'; }}
                        className="admin-logout-btn"
                    >
                        <span className="material-symbols-rounded">logout</span> Cerrar Sesión
                    </button>
                    <div className="admin-version">
                        v1.0.0
                    </div>
                </div>
            </aside>

            <main className="admin-main-content">
                <Outlet />

                {/* Discreet Developer Footer */}
                <div className="admin-footer no-print">
                    <div>Desarrollado por <strong>DevTuc</strong></div>
                    <div className="admin-footer-links">
                        <a href="https://wa.me/5493814759359" target="_blank" className="admin-footer-link">
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>chat</span> WhatsApp
                        </a>
                        <a href="mailto:devtuc25@gmail.com" className="admin-footer-link">
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>mail</span> Soporte
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;