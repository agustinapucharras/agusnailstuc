import styles from './CitizenForm.module.css';

const CitizenForm = ({ onSubmit, onBack, formData, setFormData, error }) => {
  // formData expects: { student: { name, dni }, tutor: { name, dni, email, phone } }
  
  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        student: { ...prev.student, [name]: value } 
    }));
  };

  const handleTutorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        tutor: { ...prev.tutor, [name]: value } 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const student = formData.student || {};
  const tutor = formData.tutor || {};

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Datos Personales</h2>
      {error && (
        <div style={{ padding: '1rem', background: '#F8D7DA', color: '#721C24', borderRadius: '4px', marginBottom: '1rem' }}>
            {error}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        
        {/* Section: Student */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="studentName">Nombre y Apellido *</label>
            <input 
                type="text" id="studentName" name="name" 
                value={student.name || ''} 
                onChange={(e) => {
                    if (/^[a-zA-Z\s]*$/.test(e.target.value)) handleStudentChange(e);
                }} 
                required 
                minLength={3}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="email">Correo Electrónico</label>
            <input 
                type="email" id="email" name="email" 
                value={tutor.email || ''} onChange={handleTutorChange} 
                pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                title="Debe incluir un '@' y un dominio válido (ej. .com)"
               placeholder="Para recordatorios" 
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="phone">Número de Teléfono *</label>
            <input 
                type="tel" id="phone" name="phone" 
                value={tutor.phone || ''} 
                onChange={(e) => {
                    let val = e.target.value;
                    // Ensure prefix exists
                    if (!val.startsWith('+54 9 ')) {
                        val = '+54 9 ' + val.replace(/^\+54\s?9\s?/, '').replace(/\D/g, '');
                    }
                    
                    const numberPart = val.slice(6); // get what's after "+54 9 "
                    
                    // Allow only digits in the variable part and max 10 digits
                    if (/^\d*$/.test(numberPart) && numberPart.length <= 10) {
                        setFormData(prev => ({ 
                            ...prev, 
                            tutor: { ...prev.tutor, phone: val } 
                        }));
                    }
                }} 
                onFocus={(e) => {
                    if (!tutor.phone) setFormData(prev => ({ ...prev, tutor: { ...prev.tutor, phone: '+54 9 ' } }));
                }}
                required placeholder="+54 9" 
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary}>Confirmar Turno</button>
        </div>
      </form>
    </div>
  );
};

export default CitizenForm;
