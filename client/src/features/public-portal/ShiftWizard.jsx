import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import styles from './ShiftWizard.module.css';

import StepIndicator from './components/StepIndicator';
import ServiceSelection from './components/ServiceSelection';
// import CalendarView from './components/CalendarView';
import CalendarView from './components/CalendarView';
import TimeSlots from './components/TimeSlots';
import CitizenForm from './components/CitizenForm';
import AlertModal from './components/AlertModal';
import { appointmentService } from '../../services/appointmentService';

// Steps definition
const STEPS = ['Servicio', 'Fecha y Hora', 'Datos Personales'];

const ShiftWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState({
    serviceId: null,
    date: null,
    time: null,
    citizen: { student: {}, tutor: {} }
  });
  
  // State for Async Operations
  const [slots, setSlots] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  useEffect(() => {
    // Fetch Services on Mount
    setLoadingServices(true);
    appointmentService.getServices()
        .then(data => setServices(data))
        .catch(err => console.error("Error fetching services", err))
        .finally(() => setLoadingServices(false));
  }, []);

  // Reset date, time and slots when service changes
  useEffect(() => {
    if (data.serviceId) {
      setData(prev => ({ ...prev, date: null, time: null }));
      setSlots([]);
    }
  }, [data.serviceId]);

  // --- Step 1: Service Selection ---
  const handleServiceSelect = (serviceId) => {
    // Hardcoded Service ID for now or fetched from list
    // In strict mode, we might just have default "Matrícula"
    setData(prev => ({ ...prev, serviceId }));
    setTimeout(() => setCurrentStep(2), 300);
  };

  // --- Step 2: Date & Time ---
  
  // Effect to fetch slots when Date changes
  useEffect(() => {
    if (data.date) {
        // Format to YYYY-MM-DD for API using LOCAL time to avoid timezone shifts
        // Careful with .toISOString() which is UTC.
        // A simple trick for local YYYY-MM-DD:
        const year = data.date.getFullYear();
        const month = String(data.date.getMonth() + 1).padStart(2, '0');
        const day = String(data.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        setLoadingSlots(true);
        setSlots([]); // Clear previous
        
        appointmentService.getAvailableSlots(dateStr, data.serviceId)
            .then(fetchedSlots => setSlots(fetchedSlots))
            .catch(err => console.error("Failed to fetch slots", err))
            .finally(() => setLoadingSlots(false));
    }
  }, [data.date, data.serviceId]);

  const handleDateSelect = (date) => {
    setData(prev => ({ ...prev, date, time: null }));
  };

  const handleTimeSelect = (time) => {
    setData(prev => ({ ...prev, time }));
  };

  // --- Step 2 to Step 3: Verify availability before advancing ---

  const handleContinueToStep3 = async () => {
    // Re-verify that the selected slot is still available
    setLoadingSlots(true);
    try {
        const year = data.date.getFullYear();
        const month = String(data.date.getMonth() + 1).padStart(2, '0');
        const day = String(data.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const freshSlots = await appointmentService.getAvailableSlots(dateStr, data.serviceId);
        
        // Check if selected time is still in available slots
        const isStillAvailable = freshSlots.some(slot => {
            const slotTime = typeof slot === 'string' ? slot : slot.time;
            const isSlotFree = typeof slot === 'object' ? slot.available !== false : true;
            return slotTime === data.time && isSlotFree;
        });
        
        if (!isStillAvailable) {
            setSubmitError('El horario seleccionado acaba de ser ocupado. Por favor seleccione otro horario.');
            setSlots(freshSlots); // Update with fresh slots
            setData(prev => ({ ...prev, time: null })); // Clear selected time
        } else {
            setSubmitError(null);
            setCurrentStep(3);
        }
    } catch (error) {
        console.error('Error verifying slot:', error);
        setSubmitError('Error al verificar disponibilidad. Intente nuevamente.');
    } finally {
        setLoadingSlots(false);
    }
  };

  // --- Step 3: Citizen Form & Submission ---

  const handleFormSubmit = async () => {
    setSubmitError(null);
    try {
        const year = data.date.getFullYear();
        const month = String(data.date.getMonth() + 1).padStart(2, '0');
        const day = String(data.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const payload = {
            date: dateStr,
            time: data.time,
            serviceId: data.serviceId,
            // Split Data
            studentData: { 
                name: data.citizen.student?.name || 'Cliente Anonimo', 
                dni: data.citizen.tutor?.phone?.replace(/\D/g, '') || String(Date.now()) 
            },
            clientData: { 
                fullName: data.citizen.student?.name || 'Cliente Anonimo', 
                email: data.citizen.tutor?.email || '', 
                phone: data.citizen.tutor?.phone || '',
                dni: data.citizen.tutor?.phone?.replace(/\D/g, '') || String(Date.now())
            }
        };
        
        await appointmentService.createAppointment(payload);
        setIsSuccess(true);
    } catch (error) {
        console.error("Submit Error:", error);
        const errorMsg = error.message || "Error al confirmar turno";
        
        // Show custom alert modal for duplicate appointment
        if (errorMsg.includes('turno activo')) {
            setAlertConfig({
                title: 'Ya tienes un turno pendiente',
                message: errorMsg,
                actions: [
                    {
                        label: 'Entendido',
                        primary: true,
                        onClick: () => {
                            setShowAlert(false);
                            setCurrentStep(1); // Reset to start
                        }
                    }
                ]
            });
            setShowAlert(true);
            return;
        }

        setSubmitError(errorMsg);
        
        // If slot was taken between verification and submission, go back to step 2
        if (errorMsg.includes('no está disponible') || errorMsg.includes('ocupado')) {
            setTimeout(() => {
                setCurrentStep(2);
                // Refresh slots
                const year = data.date.getFullYear();
                const month = String(data.date.getMonth() + 1).padStart(2, '0');
                const day = String(data.date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                setLoadingSlots(true);
                appointmentService.getAvailableSlots(dateStr, data.serviceId)
                    .then(freshSlots => {
                        setSlots(freshSlots);
                        setData(prev => ({ ...prev, time: null }));
                    })
                    .catch(err => console.error("Failed to refresh slots", err))
                    .finally(() => setLoadingSlots(false));
            }, 2000);
        }
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  if (isSuccess) {
    const getWhatsAppConfirmationUrl = () => {
        const phoneInfo = data.citizen.tutor?.phone || '';
        if (!phoneInfo) return '#';
        
        // 1. Limpiar todo excepto dígitos
        let phone = phoneInfo.replace(/\D/g, ''); 
        
        // 2. Remover ceros al inicio
        phone = phone.replace(/^0+/, '');

        // 3. Procesar según longitud y formato
        if (phone.length === 10) {
            // Número local de 10 dígitos
            phone = '549' + phone;
        } 
        else if (phone.length === 12) {
            if (phone.startsWith('54')) {
                // Tiene código país pero falta el 9
                phone = '549' + phone.substring(2);
            } else {
                // Puede ser código de área + 15 + número
                const match = phone.match(/^(\d{2,4})(15)(\d{6,8})$/);
                if (match) {
                    const areaCode = match[1];
                    const localNumber = match[3];
                    phone = '549' + areaCode + localNumber;
                } else {
                    // Fallback
                    phone = '549' + phone;
                }
            }
        }
        else if (phone.length === 13 && phone.startsWith('54')) {
            if (!phone.startsWith('549')) {
                phone = '549' + phone.substring(2);
            }
            phone = phone.replace(/^5490/, '549');
        }
        else if (!phone.startsWith('549')) {
            phone = '549' + phone;
        }

        const dateStr = data.date?.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
        const serviceName = services.find(s => s._id === data.serviceId)?.name || 'Trámite';
        
        const clientName = data.citizen.tutor?.fullName || data.citizen.student?.name || 'Cliente';
        const message = `Hola ${clientName}, tu turno para ${serviceName} ha sido CONFIRMADO para el día ${dateStr} a las ${data.time} hs en la Estética.`;
        
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.checkIcon}>✓</div>
          <h2>¡Turno Confirmado!</h2>
          <p>Se ha enviado un correo a <strong>{data.citizen.tutor?.email}</strong> con los detalles.</p>
          <div className={styles.summaryBox}>
            <p><strong>Fecha:</strong> {data.date?.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {data.time}</p>
            <p><strong>Cliente:</strong> {data.citizen.student?.name || data.citizen.tutor?.fullName}</p>
          </div>
          <div className={styles.secondaryAction}>
            <button className={styles.btnHome} onClick={() => window.location.reload()}>Volver al Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizardContainer}>
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      <div className={styles.content}>
        
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <ServiceSelection 
            selectedService={data.serviceId} 
            onSelect={handleServiceSelect}
            services={services} 
            isLoading={loadingServices}
          />
        )}

        {/* Step 2: Date & Time */}
        {currentStep === 2 && (
          <div className={styles.stepTwoContainer}>
            <div className={styles.colLeft}>
              <CalendarView 
                selectedDate={data.date} 
                onDateSelect={handleDateSelect} 
                service={services.find(s => s._id === data.serviceId)}
              />
            </div>
            <div className={styles.colRight}>
              <TimeSlots 
                selectedDate={data.date} 
                selectedTime={data.time} 
                onTimeSelect={handleTimeSelect}
                onClose={() => setData(prev => ({ ...prev, date: null }))}
                availableSlots={slots}
                isLoading={loadingSlots}
                continueButton={
                  data.time && (
                    <button 
                      className={styles.btnNext} 
                      onClick={handleContinueToStep3}
                      disabled={loadingSlots}
                    >
                      {loadingSlots ? 'Verificando...' : 'Continuar'}
                    </button>
                  )
                }
              />
            </div>
          </div>
        )}

        {/* Step 3: Citizen Form */}
        {currentStep === 3 && (
          <CitizenForm 
            formData={data.citizen}
            setFormData={(val) => setData(prev => ({ ...prev, citizen: typeof val === 'function' ? val(prev.citizen) : val }))}
            onSubmit={handleFormSubmit}
            onBack={goBack}
            error={submitError}
          />
        )}
      </div>

      {/* Global Back Button (except Step 1) */}
      {currentStep > 1 && !isSuccess && (
        <div className={styles.footerNav}>
          <button className={styles.btnBack} onClick={goBack}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px', marginRight: '5px' }}>arrow_back</span> Anterior
          </button>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        actions={alertConfig.actions}
      />
    </div>
  );
};

export default ShiftWizard;
