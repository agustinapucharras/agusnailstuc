import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

const styles = {
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--color-darkest)' },
    infoBox: { 
        backgroundColor: 'var(--color-light)', 
        color: 'var(--color-darkest)', 
        padding: '1rem', 
        borderRadius: 'var(--radius-md)', 
        marginBottom: '1.5rem', 
        fontSize: '0.9rem',
        borderLeft: '4px solid var(--color-secondary)'
    }
};

const NotificationConfig = () => {
    const [emailTemplate, setEmailTemplate] = useState({ subject: '', body: '' });
    const [smsTemplate, setSmsTemplate] = useState({ body: '' });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('email');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const [emailData, smsData] = await Promise.all([
                api.get('/config/email-template', { headers }),
                api.get('/config/sms-template', { headers })
            ]);

            setEmailTemplate(emailData);
            setSmsTemplate(smsData);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar plantillas');
        }
    };

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            await api.put('/config/email-template', emailTemplate, { headers });
            toast.success('Plantilla de Email guardada');
        } catch (err) {
            toast.error('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSms = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            await api.put('/config/sms-template', smsTemplate, { headers });
            toast.success('Plantilla de SMS guardada');
        } catch (err) {
            toast.error('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Configuración de Notificaciones</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                    className={`btn ${activeTab === 'email' ? 'btn-primary' : ''}`}
                    style={{ background: activeTab === 'email' ? '' : 'white', color: activeTab === 'email' ? '' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setActiveTab('email')}
                >
                    <span className="material-symbols-rounded">mail</span> Correo Electrónico
                </button>
                <button 
                    className={`btn ${activeTab === 'sms' ? 'btn-primary' : ''}`}
                    style={{ background: activeTab === 'sms' ? '' : 'white', color: activeTab === 'sms' ? '' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setActiveTab('sms')}
                >
                    <span className="material-symbols-rounded">chat</span> Plantillas WhatsApp
                </button>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                <div style={styles.infoBox}>
                    <strong>Variables Disponibles:</strong><br/>
                    Puedes usar los siguientes textos dinámicos:<br/>
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px' }}>{'{servicio}'}</code>, 
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{fecha}'}</code>, 
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{hora}'}</code>, 
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{cliente}'}</code>, 
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{dni}'}</code>,
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{solicitante}'}</code>
                    <code style={{ background: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '4px' }}>{'{solicitante}'}</code>
                </div>

                <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    color: '#0d47a1', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    marginBottom: '1.5rem', 
                    fontSize: '0.9rem',
                    borderLeft: '4px solid #2196f3'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', marginTop: '2px' }}>info</span>
                        <div>
                            <strong>¿Qué es esto?</strong><br/>
                            Esta configuración define la <strong>Notificación Genérica (Respaldo)</strong> del sistema.<br/>
                            Se utilizará automáticamente para cualquier trámite que <strong>no tenga</strong> configurado un mensaje personalizado.<br/>
                            Si deseas un mensaje específico para un trámite (ej: "Matrícula"), configúralo directamente al editar dicho trámite.
                        </div>
                    </div>
                </div>

                {activeTab === 'email' && (
                    <form onSubmit={handleSaveEmail}>
                        <h3 style={{ marginTop: 0, color: 'var(--color-secondary)' }}>Plantilla de Email</h3>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Asunto del Correo</label>
                            <input 
                                type="text" 
                                required
                                value={emailTemplate.subject}
                                onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                                style={{ width: '100%' }}
                                placeholder="Ej: Confirmación de Turno"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Cuerpo del Mensaje</label>
                            <textarea 
                                required
                                value={emailTemplate.body}
                                onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                                style={{ width: '100%', minHeight: '300px', fontFamily: 'monospace', lineHeight: '1.5' }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Guardando...' : 'Guardar Cambios Email'}
                        </button>
                    </form>
                )}

                {activeTab === 'sms' && (
                    <form onSubmit={handleSaveSms}>
                        <h3 style={{ marginTop: 0, color: 'var(--color-secondary)' }}>Plantilla de WhatsApp</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            Configura el mensaje que se enviará vía WhatsApp cuando se haga clic en el botón de recordatorio.
                        </p>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Contenido del Mensaje</label>
                            <textarea 
                                required
                                value={smsTemplate.body}
                                onChange={(e) => setSmsTemplate({...smsTemplate, body: e.target.value})}
                                style={{ width: '100%', minHeight: '150px', fontFamily: 'monospace', lineHeight: '1.5' }}
                                maxLength={300}
                            />
                            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: smsTemplate.body.length > 160 ? 'orange' : '#666' }}>
                                Caracteres: {smsTemplate.body.length} / 160 (Recomendado)
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-rounded">save</span>
                            {loading ? 'Guardando...' : 'Guardar Cambios Wsp'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default NotificationConfig;