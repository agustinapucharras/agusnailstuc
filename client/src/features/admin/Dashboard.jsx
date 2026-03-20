import { useState, useEffect } from 'react';
import AgendaView from './agenda/AgendaView';
import { api } from '../../services/api';
import './admin.css';
import './skeleton.css';

const StatsSkeleton = () => (
    <div className="admin-stats-container">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-stat-card">
                <div className="skeleton skeleton-icon"></div>
                <div className="skeleton skeleton-value"></div>
                <div className="skeleton skeleton-label"></div>
            </div>
        ))}
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        today: { total: 0, attended: 0, pending: 0 },
        nextWeek: 0
    });
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchStats(currentDate);
    }, [currentDate]);

    const fetchStats = async (dateStr) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            // Pass date to stats endpoint
            const data = await api.get(`/appointments/stats?date=${dateStr}`, { headers });
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };
    console.log(stats)

    return (
        <div>
            <div className="no-print">
                <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-accent)' }}>Resumen del Día</h2>
                
                {loading ? (
                    <StatsSkeleton />
                ) : (
                    <div className="admin-stats-container">
                        <div className="admin-stat-card" style={{ borderTopColor: '#f8a7aaff' }}>
                            <div className="admin-stat-icon-container">
                                <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#f8a7aaff' }}>event_available</span>
                            </div>
                            <div className="admin-stat-value">{stats.today?.total || 0}</div>
                            <div className="admin-stat-label">TURNOS EN FECHA</div>
                        </div>

                        <div className="admin-stat-card" style={{ borderTopColor: '#f8a7aaff' }}>
                            <div className="admin-stat-icon-container">
                                <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#f8a7aaff' }}>pending_actions</span>
                            </div>
                            <div className="admin-stat-value">{stats.today?.pending || 0}</div>
                            <div className="admin-stat-label">PENDIENTES</div>
                        </div>

                        <div className="admin-stat-card" style={{ borderTopColor: '#f8a7aaff' }}>
                            <div className="admin-stat-icon-container">
                                <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#f8a7aaff' }}>check_circle</span>
                            </div>
                            <div className="admin-stat-value">{stats.today?.attended || 0}</div>
                            <div className="admin-stat-label">ASISTIDOS</div>
                        </div>

                        <div className="admin-stat-card" style={{ borderTopColor: '#f8a7aaff' }}>
                            <div className="admin-stat-icon-container">
                                <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#f8a7aaff' }}>event_upcoming</span>
                            </div>
                            <div className="admin-stat-value">{stats.nextWeek || 0}</div>
                            <div className="admin-stat-label">PRÓXIMA SEMANA</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="admin-dashboard-agenda">
                <AgendaView 
                    onDateChange={(date) => setCurrentDate(date)} 
                    onStatusChange={() => fetchStats(currentDate)}
                />
            </div>
        </div>
    );
};

export default Dashboard;