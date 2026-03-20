import styles from './TimeSlots.module.css';
import { Calendar as CalendarIcon, X } from 'lucide-react';

const TimeSlots = ({ selectedDate, onTimeSelect, selectedTime, availableSlots = [], isLoading = false, onClose, continueButton }) => {
  if (!selectedDate) {
    return (
      <div className={styles.emptyState}>
        <CalendarIcon size={48} color="var(--color-border)" />
        <p className={styles.emptyStateText}>Seleccione una fecha para ver los horarios disponibles.</p>
      </div>
    );
  }

  const dateStr = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const hasSlots = !isLoading && availableSlots.length > 0;
  const noSlots = !isLoading && availableSlots.length === 0;

  return (
    <>
    <div className={styles.overlay} onClick={onClose}></div>
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</h3>
        <div className={styles.headerRight}>
          <span className={`${styles.status} ${noSlots ? styles.statusUnavailable : ''}`}>
            <span className={`${styles.dot} ${noSlots ? styles.dotRed : ''}`}></span> 
            {isLoading ? 'Cargando...' : noSlots ? 'No disponible' : 'Disponible'}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
      </div>
      {hasSlots && <p className={styles.subtitle}>Seleccioná un horario para continuar</p>}
      
      <div className={styles.grid}>
        {noSlots && <p className={styles.noSlotsMessage}>No hay turnos disponibles para esta fecha.</p>}
        {availableSlots.map(slot => {
          const isAvailable = slot.available !== false; // Handle both old format (string) and new format (object)
          const timeStr = typeof slot === 'string' ? slot : slot.time;
          const isSelected = selectedTime === timeStr;
          
          return (
            <button 
              key={timeStr} 
              className={`${styles.slot} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.occupied : ''}`}
              onClick={() => isAvailable && onTimeSelect(timeStr)}
              disabled={!isAvailable}
              title={!isAvailable ? 'Horario ocupado' : ''}
            >
              {timeStr}
              {!isAvailable && <span className={styles.lockIcon}>🔒</span>}
            </button>
          );
        })}
      </div>

      {selectedTime && (
        <>
          <div className={styles.confirmation}>
            <div className={styles.iconBox}><CalendarIcon color="white" /></div>
            <div>
              <span className={styles.label}>TURNO SELECCIONADO</span>
              <p className={styles.value}>{dateStr} • {selectedTime} HS</p>
            </div>
          </div>
          {continueButton && (
            <div className={styles.modalActions}>
              {continueButton}
            </div>
          )}
        </>
      )}
    </div>
    </>
    
  );
};

export default TimeSlots;
