import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "1rem" },
  th: {
    textAlign: "left",
    padding: "15px",
    borderBottom: "2px solid #eee",
    color: "var(--color-text-muted)",
    fontWeight: "600",
  },
  td: {
    padding: "15px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
  },
  actionBtn: {
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "1.2rem",
    padding: "5px",
    margin: "0 5px",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "var(--radius-lg)",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "var(--shadow-lg)",
    padding: 0,
  },
  modalHeader: {
    background: "var(--color-darkest)",
    color: "white",
    padding: "1.5rem",
    borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
    textAlign: "center",
    margin: 0,
  },
  modalBody: { padding: "2rem" },
  formGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: "0.5rem", fontWeight: "bold" },
  input: { width: "100%", padding: "0.7rem" },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
};

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: 15,
    isActive: true,
    requirements: "",
    allowedDays: [],
    startTime: "",
    endTime: "",
    startDate: "",
    endDate: "",
    emailSubject: "",
    emailBody: "",
    whatsappBody: "",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Assuming the backend supports ?all=true to show inactive services
      const data = await api.get("/services?all=true", { headers });
      setServices(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar trámites");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        duration: service.duration,
        isActive: service.isActive,
        requirements: service.requirements || "",
        allowedDays: service.allowedDays || [],
        startTime: service.timeRange?.startTime || "",
        endTime: service.timeRange?.endTime || "",
        startDate: service.dateRange?.start
          ? service.dateRange.start.split("T")[0]
          : "",
        endDate: service.dateRange?.end
          ? service.dateRange.end.split("T")[0]
          : "",
        emailSubject: service.emailTemplate?.subject || "",
        emailBody: service.emailTemplate?.body || "",
        whatsappBody: service.whatsappTemplate?.body || "",
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        duration: 15,
        isActive: true,
        requirements: "",
        allowedDays: [],
        startTime: "",
        endTime: "",
        startDate: "",
        endDate: "",
        emailSubject: "",
        emailBody: "",
        whatsappBody: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Clean payload - only send fields that exist in the Service model
      const payload = {
        name: formData.name,
        duration: formData.duration,
        isActive: formData.isActive,
        requirements: formData.requirements,
        allowedDays: formData.allowedDays || [],
      };

      // Only include timeRange if at least one field has a value
      if (formData.startTime || formData.endTime) {
        payload.timeRange = {
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
        };
      }

      // Only include dateRange if at least one field has a value
      if (formData.startDate || formData.endDate) {
        payload.dateRange = {
          start: formData.startDate || null,
          end: formData.endDate || null,
        };
      }

      // Notification Templates
      payload.emailTemplate = {
        subject:
          formData.emailSubject && formData.emailSubject.trim() !== ""
            ? formData.emailSubject
            : null,
        body:
          formData.emailBody && formData.emailBody.trim() !== ""
            ? formData.emailBody
            : null,
      };
      payload.whatsappTemplate = {
        body:
          formData.whatsappBody && formData.whatsappBody.trim() !== ""
            ? formData.whatsappBody
            : null,
      };

      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload, { headers });
        toast.success("Trámite actualizado");
      } else {
        await api.post("/services", payload, { headers });
        toast.success("Trámite creado");
      }
      handleCloseModal();
      fetchServices();
    } catch (err) {
      toast.error("Error al guardar: " + err.message);
    }
  };

  const handleToggleStatus = async (service) => {
    const action = service.isActive ? "desactivar" : "activar";
    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} trámite?`,
      text: `¿Estás seguro de ${action} "${service.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: service.isActive ? "#f0ad4e" : "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.patch(`/services/${service._id}/toggle`, {}, { headers });

      Swal.fire({
        title: "¡Éxito!",
        text: `Trámite ${service.isActive ? "desactivado" : "activado"} correctamente`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchServices();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Hubo un error al procesar la solicitud",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleDelete = async (service) => {
    const result = await Swal.fire({
      title: "¿Eliminar trámite?",
      text: `¿Estás seguro de eliminar "${service.name}"? Desaparecerá de la lista.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.delete(`/services/${service._id}`, { headers });

      Swal.fire({
        title: "¡Eliminado!",
        text: "El trámite ha sido eliminado.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchServices();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Hubo un error al eliminar",
        icon: "error",
      });
    }
  };

  return (
    <div>
      <div className="admin-header-controls">
        <h2 className="admin-page-title">Gestión de Servicios</h2>
        <button
          onClick={() => handleOpenModal()}
          className="admin-btn admin-btn-primary"
        >
          <span className="material-symbols-rounded">add</span> Nuevo Servicio
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre del Servicio</th>
                  <th>Duración (min)</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr
                    key={service._id}
                    style={{ opacity: service.isActive ? 1 : 0.6 }}
                  >
                    <td data-label="Nombre">
                      <strong>{service.name}</strong>
                    </td>
                    <td data-label="Duración">{service.duration} min</td>
                    <td data-label="Estado">
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor: service.isActive
                            ? "#D4EDDA"
                            : "#FFF3CD",
                          color: service.isActive ? "#155724" : "#856404",
                        }}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "5px", marginRight: "5px" }}
                        title="Editar"
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "1.2rem", color: "#666" }}
                        >
                          edit
                        </span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(service)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "5px", marginRight: "5px" }}
                        title={service.isActive ? "Desactivar" : "Activar"}
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{
                            fontSize: "1.2rem",
                            color: service.isActive ? "#f0ad4e" : "#28a745",
                          }}
                        >
                          {service.isActive ? "toggle_on" : "toggle_off"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDelete(service)}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "5px" }}
                        title="Eliminar"
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "1.2rem", color: "#dc3545" }}
                        >
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalHeader}>
              {editingService ? "Editar Servicio" : "Nuevo Servicio"}
            </h3>
            <div style={styles.modalBody}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre</label>
                  <input
                    className="input"
                    style={styles.input}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duración (minutos)</label>
                  <select
                    className="input"
                    style={styles.input}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    required
                  >
                    <option value={5}>5 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={60}>120 minutos (2 horas)</option>
                  </select>
                  <small
                    style={{
                      color: "#888",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    Esta duración determina los horarios disponibles para este
                    trámite.
                  </small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Requisitos (Texto visible al solicitante)
                  </label>
                  <textarea
                    className="input"
                    style={{
                      ...styles.input,
                      height: "80px",
                      resize: "vertical",
                    }}
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                  />
                </div>

                <hr
                  style={{
                    margin: "20px 0",
                    border: "0",
                    borderTop: "1px solid #eee",
                  }}
                />
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "var(--color-darkest)",
                  }}
                >
                  Disponibilidad (Opcional)
                </h4>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  Si no se configuran, se usarán los días y horarios generales.
                </p>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Días Específicos</label>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                      (day, index) => {
                        const isSelected = formData.allowedDays.includes(index);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const newDays = isSelected
                                ? formData.allowedDays.filter(
                                    (d) => d !== index,
                                  )
                                : [...formData.allowedDays, index];
                              setFormData({
                                ...formData,
                                allowedDays: newDays,
                              });
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "4px",
                              border: `1px solid ${isSelected ? "var(--color-primary)" : "#ddd"}`,
                              background: isSelected
                                ? "var(--color-primary)"
                                : "#fff",
                              color: isSelected ? "#fff" : "#666",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                            }}
                          >
                            {day}
                          </button>
                        );
                      },
                    )}
                  </div>
                  {formData.allowedDays.length === 0 && (
                    <small style={{ color: "#888", fontStyle: "italic" }}>
                      Disponible todos los días hábiles generales.
                    </small>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Horario Específico</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="time"
                      className="input"
                      style={styles.input}
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                    <span style={{ alignSelf: "center" }}>a</span>
                    <input
                      type="time"
                      className="input"
                      style={styles.input}
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                  <small style={{ color: "#888" }}>
                    Dejar vacío para usar horario general.
                  </small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Vigencia (Opcional)</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <small style={{ display: "block", marginBottom: "5px" }}>
                        Desde:
                      </small>
                      <input
                        type="date"
                        className="input"
                        style={styles.input}
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <small style={{ display: "block", marginBottom: "5px" }}>
                        Hasta:
                      </small>
                      <input
                        type="date"
                        className="input"
                        style={styles.input}
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <small style={{ color: "#888" }}>
                    Ej: Solo turnos entre Febrero y Marzo.
                  </small>
                </div>

                <hr
                  style={{
                    margin: "20px 0",
                    border: "0",
                    borderTop: "1px solid #eee",
                  }}
                />
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: "var(--color-darkest)",
                  }}
                >
                  Notificaciones Personalizadas (Opcional)
                </h4>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    marginBottom: "15px",
                  }}
                >
                  Configura el mensaje que recibirán los usuarios al confirmar
                  un turno para <strong>este trámite</strong>. Si se dejan
                  vacíos, se usarán los mensajes predeterminados del sistema.
                  <br />
                  <strong>Variables disponibles:</strong>{" "}
                  {`{cliente}, {telefono}, {fecha}, {hora}, {servicio}`}
                </p>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Asunto del Correo</label>
                  <input
                    className="input"
                    style={styles.input}
                    value={formData.emailSubject}
                    onChange={(e) =>
                      setFormData({ ...formData, emailSubject: e.target.value })
                    }
                    placeholder="Ej: Confirmación del servicio Semipermanente"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Cuerpo del Correo</label>
                  <textarea
                    className="input"
                    style={{
                      ...styles.input,
                      height: "120px",
                      resize: "vertical",
                      fontFamily: "monospace",
                      fontSize: "13px",
                    }}
                    value={formData.emailBody}
                    onChange={(e) =>
                      setFormData({ ...formData, emailBody: e.target.value })
                    }
                    placeholder={`Hola {cliente},\n\nSu turno para {servicio} ha sido confirmado.\nLa cita es el {fecha} a las {hora}.\n\nRequisitos:\n${formData.requirements || "..."}`}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Mensaje de WhatsApp</label>
                  <textarea
                    className="input"
                    style={{
                      ...styles.input,
                      height: "80px",
                      resize: "vertical",
                    }}
                    value={formData.whatsappBody}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsappBody: e.target.value })
                    }
                    placeholder={`Hola {cliente}, recordamos tu turno para {servicio} el {fecha} a las {hora}.`}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn"
                    style={{ background: "#ccc" }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceList;
