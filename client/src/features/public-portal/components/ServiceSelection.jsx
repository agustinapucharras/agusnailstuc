import styles from './ServiceSelection.module.css';
import { FileText, GraduationCap, ClipboardList, Info, CloudCog } from 'lucide-react';

const ServiceSelection = ({ onSelect, selectedService, services = [], isLoading = false }) => {

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Seleccione el Servicio</h2>
        <p className={styles.description}>Cargando opciones disponibles...</p>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}></div>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
      return (
        <div className={styles.container}>
            <div className={styles.emptyState}>
                <Info className={styles.emptyStateIcon} strokeWidth={1.5} />
                <h3>No hay trámites disponibles</h3>
                <p>En este momento no hay turnos habilitados para ningun servicio. Por favor intente más tarde.</p>
            </div>
        </div>
      );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Seleccione el Servicio</h2>
      <p className={styles.description}>Elija el servicio para ver la disponibilidad correspondiente.</p>
      
      <div className={styles.grid}>
        {services.map((service) => {
          const isSelected = selectedService === service._id;
          const isActive = service.isActive; 
          
          return (
            <button
              key={service._id}
              className={`${styles.card} ${isSelected ? styles.selected : ''} ${!isActive ? styles.disabled : ''}`}
              onClick={() => isActive && onSelect(service._id)}
              disabled={!isActive}
              title={!isActive ? "Servicio no disponible momentáneamente" : ""}
            >
              <div className={styles.iconWrapper}>
                <FileText size={24} />
              </div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>{service.name}</h3>
                <p className={styles.cardDesc}>
                    {!isActive ? (
                        <span style={{ color: '#d9534f', fontWeight: 'bold' }}>
                            (No disponible) 
                        </span>
                    ) : (
                        service.requirements || ''
                    )}
                </p>
                <span className={styles.meta}>Duración: {service.duration} min</span>
              </div>
              <div className={styles.radio}>
                {isActive && <div className={styles.radioInner} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;
