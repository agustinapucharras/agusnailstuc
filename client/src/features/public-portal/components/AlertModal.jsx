import styles from './AlertModal.module.css';
import { AlertCircle, X } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, actions }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        
        <div className={styles.iconContainer}>
          <AlertCircle size={48} className={styles.icon} />
        </div>
        
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          {actions?.map((action, index) => (
            <button
              key={index}
              className={`${styles.btn} ${action.primary ? styles.btnPrimary : styles.btnSecondary}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default AlertModal;
