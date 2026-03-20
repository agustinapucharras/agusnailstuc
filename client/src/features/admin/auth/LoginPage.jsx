import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import authService from '../../../services/authService';
import useAuthStore from '../../../stores/useAuthStore';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
    const login = useAuthStore(state => state.login);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    
    if (isAuthenticated) {
        // Security Check
        return <Navigate to="/admin/dashboard" replace />;
    }

    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.login(credentials.username, credentials.password);
            // ... (sync logic) ...
            if (data.token) {
                 const userData = data.admin || data.employee;
                 const userWithType = { ...userData, userType: data.userType };
                 login(userWithType, data.token);
            }

            toast.success('Bienvenido de nuevo');
            window.location.href = '/admin/dashboard';
        } catch (err) {
            toast.error(err.message || 'Credenciales inválidas');
        }
    };

    const handleRecovery = async (e) => {
        e.preventDefault();
        if (!recoveryEmail) return toast.error('Ingrese su email');
        
        try {
            await authService.recover(recoveryEmail);
            toast.success('Si el email coincide, recibirá instrucciones en breve.');
            setIsRecovering(false);
        } catch (err) {
            // Security: Always show success or generic error, but here we show actual error for UX if needed
             toast.error(err.message);
        }
    };

    return (
        <div className="admin-login-container">
            <Link to="/" className="admin-back-button">
                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>arrow_back</span>
                Volver al Inicio
            </Link>

            <div className="admin-login-card">
                <div className="admin-login-logo">
                    <span className="material-symbols-rounded">security</span>
                </div>
                <h1 className="admin-login-title">Acceso al Sistema</h1>
                {isRecovering ? (
                    <form onSubmit={handleRecovery}>
                        <div className="admin-input-group">
                            <label className="admin-label">Email de Recuperación</label>
                             <input
                                type="text" // Username is email in this system apparently
                                required
                                placeholder="usuario@estetica.com"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                className="admin-login-input"
                            />
                        </div>
                        <button type="submit" className="admin-login-button">
                            Enviar <span className="material-symbols-rounded">send</span>
                        </button>
                        <button 
                            type="button" 
                            className="admin-login-button" 
                            style={{ marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ccc' }}
                            onClick={() => setIsRecovering(false)}
                        >
                            Cancelar
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="admin-input-group">
                            <label className="admin-label">Usuario / Email</label>
                            <input
                                name="username"
                                type="text"
                                required
                                placeholder="Ingrese su usuario"
                                onChange={handleChange}
                                className="admin-login-input"
                            />
                        </div>
                        <div className="admin-input-group">
                            <label className="admin-label">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                onChange={handleChange}
                                className="admin-login-input"
                            />
                        </div>
                        
                        <button type="submit" className="admin-login-button">
                            Ingresar <span className="material-symbols-rounded">login</span>
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                             <button 
                                type="button" 
                                onClick={() => setIsRecovering(true)}
                                style={{ background: 'none', border: 'none', color: '#052659', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                             >
                                ¿Olvidaste tu contraseña?
                             </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;