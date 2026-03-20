import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.mainInfo}>
            <p>&copy; {new Date().getFullYear()} Agus Nails Tuc. <span className={styles.rights}>Todos los derechos reservados.</span></p>
        </div>
        
        {/* Discreet Developer Footer */}
        <div className={styles.devSection}>
            <div className={styles.divider}></div>
            <div className={styles.devContent}>
                <span>Desarrollado por <strong>DevTuc</strong></span>
                <span className={styles.separator}>•</span>
                <div className={styles.contactLinks}>
                    <a href="https://wa.me/5493814759359" target="_blank" rel="noopener noreferrer" className={styles.link}>
                        <span className="material-symbols-rounded" style={{fontSize: '14px'}}>chat</span> WhatsApp
                    </a>
                    <a href="mailto:devtuc25@gmail.com" className={styles.link}>
                        <span className="material-symbols-rounded" style={{fontSize: '14px'}}>mail</span> Soporte
                    </a>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
