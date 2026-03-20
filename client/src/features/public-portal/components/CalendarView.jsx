import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CalendarView.module.css';

const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

const CalendarView = ({ onDateSelect, selectedDate, service }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get days in month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
  }
  
  // Helper to check if date is valid
  const isDateDisabled = (dateObj) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (dateObj < today) return true; // Past dates

    if (!service) return false;

    // 1. Check Date Range (Vigencia) - Fix Timezone issues
    if (service.dateRange) {
        if (service.dateRange.start) {
            const sDate = new Date(service.dateRange.start);
            // Create local date from UTC components (assuming server sends ISO UTC)
            const startLocal = new Date(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate(), 0, 0, 0, 0);
            if (dateObj < startLocal) return true;
        }
        if (service.dateRange.end) {
            const eDate = new Date(service.dateRange.end);
            // Create local date for end of day
            const endLocal = new Date(eDate.getUTCFullYear(), eDate.getUTCMonth(), eDate.getUTCDate(), 23, 59, 59, 999);
            if (dateObj > endLocal) return true;
        }
    }

    // 2. Check Allowed Days (0=Sun, 1=Mon...)
    if (service.allowedDays && service.allowedDays.length > 0) {
        if (!service.allowedDays.includes(dateObj.getDay())) return true;
    }

    return false;
  };

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const isSelected = selectedDate && dateObj.toDateString() === selectedDate.toDateString();
    const disabled = isDateDisabled(dateObj);
    
    days.push(
      <button 
        key={d} 
        disabled={disabled}
        className={`${styles.day} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && onDateSelect(dateObj)}
        style={disabled ? { opacity: 0.3, cursor: 'not-allowed', background: '#f5f5f5', color: '#ccc' } : {}}
      >
        {d}
      </button>
    );
  }

  // Render Service Hours Logic
  const renderServiceHours = () => {
    const fullDayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    // Default Configuration
    if (!service || (!service.allowedDays?.length && !service.timeRange?.startTime)) {
        return (
             <div className={styles.hoursInfo}>
                <strong>HORARIOS DE ATENCIÓN</strong>
                <div className={styles.row}><span>Lunes a Viernes</span> <span>08:00 - 13:00</span></div>
                <div className={styles.row}><span>Sábados</span> <span>09:00 - 12:00</span></div>
             </div>
        );
    }

    // Custom Configuration
    const hasCustomDays = service.allowedDays && service.allowedDays.length > 0;
    const hasCustomTime = service.timeRange && service.timeRange.startTime;

    const timeText = hasCustomTime 
        ? `${service.timeRange.startTime} - ${service.timeRange.endTime}`
        : "08:00 - 13:00"; // Fallback to default weekday hours

    const daysText = hasCustomDays
        ? [...service.allowedDays].sort().map(d => fullDayNames[d]).join(', ')
        : "Lunes a Viernes"; // Fallback if only time is customized but not days? (Ambiguous, but safer default)

    return (
        <div className={styles.hoursInfo}>
            <strong>HORARIOS DEL TRÁMITE</strong>
            <p style={{margin: '8px 0', fontSize: '0.9rem', color: '#444', lineHeight: '1.4'}}>
                {daysText}
            </p>
            <div className={styles.row}>
                <span>Horario:</span> <span>{timeText}</span>
            </div>
            {/* Show Saturday separate if not in allowedDays? No, if allowedDays are set, we follow them strictly */}
            {!hasCustomDays && !service.allowedDays?.includes(6) && (
                 <div className={styles.row} style={{marginTop: '4px', fontSize: '0.85em', color: '#666'}}>
                    {/* Only show default Saturday if we differ back to defaults? 
                        If we are in "Custom Config" block, we assume the config serves all.
                        So if user didn't select Saturday in "Specific Days", we don't show it.
                    */}
                 </div>
            )}
        </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.monthTitle}>{monthNames[month]} {year}</h3>
        <div className={styles.nav}>
          <button onClick={handlePrevMonth} className={styles.navBtnPrev}><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth} className={styles.navBtnNext}><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className={styles.grid}>
        {DAYS.map(day => <div key={day} className={styles.dayLabel}>{day}</div>)}
        {days}
      </div>
      
      <div className={styles.legend}>
         {renderServiceHours()}
      </div>
    </div>
  );
};

export default CalendarView;
