import styles from './Header.module.css';
import { Building2 } from 'lucide-react'; // Placeholder icon
import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" className={styles.logo} />

        <div className={styles.textContainer}>
  <h2 className={styles.title}>Agus Nails Tuc</h2>
          <span className={styles.subtitle}>Gestión de Turnos</span>
        </div>
        <Link to="/admin" className={styles.adminButton}>
          <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>admin_panel_settings</span>
          Acceso Personal
        </Link>
      </div>
    </header>
  );
};

export default Header;
