import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

const styles = {
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--color-darkest)' },
    row: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    col: { flex: 1, minWidth: '200px' },
    checkboxGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '0.5rem' },
    checkboxLabel: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px', 
        padding: '8px 12px', 
        borderRadius: 'var(--radius-sm)', 
        border: '1px solid #ddd', 
        cursor: 'pointer',
        userSelect: 'none'
    },
    checkedLabel: {
        backgroundColor: 'var(--color-light)',
        borderColor: 'var(--color-secondary)',
        color: 'var(--color-primary)',
        fontWeight: 'bold'
    }
};

const ConfigView = () => {
    const [config, setConfig] = useState({
        startTime: '08:00',
        endTime: '12:00',
        interval: 15,
        daysOff: [] 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const data = await api.get('/config', { headers });
            setConfig(data);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar configuración');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            await api.put('/config', config, { headers });
            toast.success('Configuración actualizada');
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayIndex) => {
        const currentDaysOff = config.daysOff || [];
        if (currentDaysOff.includes(dayIndex)) {
            setConfig({ ...config, daysOff: currentDaysOff.filter(d => d !== dayIndex) });
        } else {
            setConfig({ ...config, daysOff: [...currentDaysOff, dayIndex] });
        }
    };

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Configuración General</h2>

            <div className="card" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSave}>
                    <div style={styles.row}>
                        <div style={{ ...styles.formGroup, ...styles.col }}>
                            <label style={styles.label}>Hora de Inicio</label>
                            <input 
                                type="time" 
                                value={config.startTime} 
                                onChange={(e) => setConfig({...config, startTime: e.target.value})}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ ...styles.formGroup, ...styles.col }}>
                            <label style={styles.label}>Hora de Fin</label>
                            <input 
                                type="time" 
                                value={config.endTime} 
                                onChange={(e) => setConfig({...config, endTime: e.target.value})}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ ...styles.formGroup, ...styles.col }}>
                            <label style={styles.label}>Intervalo (minutos)</label>
                            <input 
                                type="number" 
                                value={config.interval} 
                                onChange={(e) => setConfig({...config, interval: e.target.value})}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Días No Laborables (Semana)</label>
                        <div style={styles.checkboxGroup}>
                            {days.map((day, index) => {
                                const isSelected = config.daysOff?.includes(index);
                                return (
                                    <label key={index} style={{ ...styles.checkboxLabel, ...(isSelected ? styles.checkedLabel : {}) }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleDay(index)}
                                            style={{ accentColor: 'var(--color-primary)' }}
                                        />
                                        {day}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Feriados / Fechas Bloqueadas (YYYY-MM-DD)</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input 
                                type="date" 
                                id="newHoliday"
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                            <button 
                                type="button"
                                className="btn"
                                onClick={() => {
                                    const input = document.getElementById('newHoliday');
                                    const val = input.value;
                                    if (val && !config.holidays?.includes(val)) {
                                        setConfig({ ...config, holidays: [...(config.holidays || []), val] });
                                        input.value = '';
                                    }
                                }}
                                style={{ background: 'var(--color-secondary)', color: 'white', padding: '0 15px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {config.holidays?.map((day) => (
                                <div key={day} style={{ 
                                    background: '#fee2e2', 
                                    color: '#b91c1c', 
                                    padding: '4px 10px', 
                                    borderRadius: '16px', 
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {day}
                                    <span 
                                        onClick={() => setConfig({ ...config, holidays: config.holidays.filter(d => d !== day) })}
                                        style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                    >✖</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-rounded">save</span>
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConfigView;