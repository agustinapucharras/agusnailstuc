import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import toast from "react-hot-toast";
import "../admin.css"; // Keep for print styles
import "../skeleton.css"; // Import skeleton styles
import { printAgenda } from "./printAgendaHelper";

const AgendaSkeleton = () => (
  <div
    className="skeleton-agenda-container"
    style={{ background: "transparent", boxShadow: "none", padding: 0 }}
  >
    {/* We mimic the card structure */}
    <div
      style={{
        marginBottom: "1.5rem",
        background: "white",
        borderRadius: "8px",
        overflow: "hidden",
        padding: "1rem",
      }}
    >
      <div
        className="skeleton-header skeleton"
        style={{ width: "30%", height: "28px", marginBottom: "1.5rem" }}
      ></div>
      <div
        className="skeleton-table-header skeleton"
        style={{ marginBottom: "0" }}
      ></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="skeleton-row"
          style={{ borderBottom: "1px solid #eee" }}
        >
          <div
            className="skeleton-cell skeleton"
            style={{ width: "10%" }}
          ></div>
          <div
            className="skeleton-cell skeleton"
            style={{ width: "20%" }}
          ></div>
          <div
            className="skeleton-cell skeleton"
            style={{ width: "15%" }}
          ></div>
          <div
            className="skeleton-cell skeleton"
            style={{ width: "20%" }}
          ></div>
          <div
            className="skeleton-cell skeleton"
            style={{ width: "15%" }}
          ></div>
        </div>
      ))}
    </div>
  </div>
);

const AgendaView = ({ onDateChange, onStatusChange }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [occupiedDays, setOccupiedDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // New State for Filter & Pagination
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Initial Load
  useEffect(() => {
    fetchServices();
    fetchAppointments();
    if (onDateChange && date) {
      onDateChange(date);
    }
  }, [date, onDateChange]); // Add services in dep array if needed, but fetchServices is static.

  // Fetch on filter change
  useEffect(() => {
    fetchAppointments();
  }, [selectedService]); // Refetch when service filter changes

  useEffect(() => {
    fetchOccupiedDays();
  }, [currentMonth, currentYear]);

  const fetchServices = async () => {
    try {
      // Fetch all services to populate filter
      const data = await api.get("/services");
      setServices(data);
    } catch (err) {
      console.error("Error loading services:", err);
    }
  };

  const fetchOccupiedDays = async () => {
    try {
      const data = await api.get(
        `/appointments/occupied-days?year=${currentYear}&month=${currentMonth}`,
      );
      setOccupiedDays(data.map((d) => d.date));
    } catch (err) {
      console.error("Error fetching occupied days:", err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = "/appointments";
      if (date) {
        url += `?date=${date}`; // Fetch specific date
      } else {
        url += `?month=${currentMonth}&year=${currentYear}`; // Fetch whole month
      }

      if (selectedService) {
        url += `&serviceId=${selectedService}`;
      }

      const data = await api.get(url, { headers });
      setAppointments(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar agenda");
    } finally {
      setLoading(false);
      setCurrentPage(1); // Reset to page 1 on new fetch
    }
  };

  const handlePrint = () => {
    printAgenda(groupedAppointments);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.patch(
        `/appointments/${id}/status`,
        { status: newStatus },
        { headers },
      );

      toast.success(
        `Turno ${newStatus === "asistio" ? "marcado como asistido" : newStatus === "cancelado" ? "cancelado" : "restaurado"}`,
      );
      fetchAppointments();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado");
    }
  };

  const handleSendReminder = async (appointment, type) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.post(
        `/appointments/${appointment._id}/reminder?type=${type}`,
        {},
        { headers },
      );

      if (type === "email") {
        // Show success message for email
        toast.success("Recordatorio enviado por email");
      } else if (type === "whatsapp") {
        // Open WhatsApp if link is available
        if (response.whatsappLink) {
          window.open(response.whatsappLink, "_blank");
        } else {
          toast.error(
            "No se pudo generar el enlace de WhatsApp (revise el teléfono)",
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error al enviar recordatorio");
    }
  };

  const fetchAvailableSlots = async (dateStr, serviceId) => {
    try {
      setAvailableSlots([]);
      setSelectedSlot("");
      // Use public endpoint or admin endpoint? Public is fine for slots.
      const slots = await api.get(
        `/appointments/slots?date=${dateStr}&serviceId=${serviceId}`,
      );
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      toast.error("Error al cargar horarios disponibles");
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedAppointment || !selectedSlot || !rescheduleDate) return;

    setRescheduleLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await api.put(
        `/appointments/${selectedAppointment._id}/reschedule`,
        {
          date: rescheduleDate,
          time: selectedSlot,
        },
        { headers },
      );

      toast.success("Turno reprogramado exitosamente");
      setRescheduleModalOpen(false);
      setAvailableSlots([]);
      setSelectedSlot("");
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error al reprogramar turno");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.student?.name?.toLowerCase().includes(term) ||
      app.student?.dni?.includes(term) ||
      app.client?.fullName?.toLowerCase().includes(term) ||
      app.service?.name?.toLowerCase().includes(term)
    );
  });

  // Group appointments by date
  const groupedAppointments = {};
  if (date) {
    if (filteredAppointments.length > 0) {
      groupedAppointments[date] = filteredAppointments;
    }
  } else {
    filteredAppointments.forEach((app) => {
      if (!groupedAppointments[app.date]) {
        groupedAppointments[app.date] = [];
      }
      groupedAppointments[app.date].push(app);
    });
  }

  const sortedDates = Object.keys(groupedAppointments).sort();

  return (
    <div className="agenda-container">
         <h2 className="admin-page-title">Agenda Diaria</h2>
      <div
        className="admin-header-controls no-print"
        
      >
       
        <div className="admin-controls-group">
          <div className="admin-date-group">
            <label className="admin-header-label">Trámite:</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="admin-inp"
              style={{ maxWidth: "200px" }}
            >
              <option value="">Todos los trámites</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-date-group">
            <label className="admin-header-label">Mes:</label>
            <input
              type="month"
              value={`${currentYear}-${String(currentMonth).padStart(2, "0")}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setCurrentYear(parseInt(year));
                setCurrentMonth(parseInt(month));
                setAppointments([]); // Clear appointments when changing month
                setDate(""); // Reset selected date
                if (onDateChange) onDateChange("");
              }}
              className="admin-inp"
            />
          </div>

          <div className="admin-date-group" style={{ position: "relative" }}>
            <span
              className="material-symbols-rounded"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#888",
                fontSize: "20px",
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-inp"
              style={{ paddingLeft: "35px", minWidth: "220px" }}
            />
          </div>
{/* 
          <button
            onClick={handlePrint}
            className="admin-btn admin-btn-secondary"
            title="Imprime la lista de turnos (check-list)"
          >
            <span className="material-symbols-rounded">print</span> Imprimir
            Lista
          </button> */}
          {/* <button
            onClick={() => printAgenda(groupedAppointments, "report")}
            className="admin-btn admin-btn-secondary"
            style={{ backgroundColor: "#487874", color: "white" }}
            title="Imprime el reporte final con asistencias y totales"
          >
            <span className="material-symbols-rounded">assessment</span> Reporte
            Diario
          </button> */}
          <button
            onClick={fetchAppointments}
            className="admin-btn admin-btn-secondary"
          >
            <span className="material-symbols-rounded">refresh</span> Actualizar
          </button>
        </div>
      </div>

      {/* Occupied Days Indicator */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem",
          border: "1px solid #e0e0e0",
        }}
        className="no-print"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ color: "var(--color-primary)" }}
          >
            event_available
          </span>
          <strong style={{ color: "var(--color-text)" }}>
            Días con turnos en{" "}
            {new Date(currentYear, currentMonth - 1).toLocaleDateString(
              "es-ES",
              { month: "long", year: "numeric" },
            )}
            :
          </strong>
        </div>

        {occupiedDays.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {occupiedDays.sort().map((occupiedDate) => {
              const dateObj = new Date(occupiedDate + "T00:00:00");
              const dayNum = dateObj.getDate();
              const isSelected = occupiedDate === date;

              return (
                <button
                  key={occupiedDate}
                  onClick={() => setDate(occupiedDate)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: isSelected
                      ? "2px solid var(--color-primary)"
                      : "1px solid #6a2424ff",
                    background: isSelected ? "var(--color-primary)" : "white",
                    color: isSelected ? "var(--color-accent)" : "var(--color-text)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: isSelected ? "bold" : "normal",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                      ? "0 2px 8px rgba(72, 120, 116, 0.2)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.background = "#f0f0f0";
                      e.target.style.borderColor = "var(--color-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.background = "white";
                      e.target.style.borderColor = "#ddd";
                    }
                  }}
                  title={`Ver agenda del ${new Date(occupiedDate + "T00:00:00").toLocaleDateString("es-ES")}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        ) : (
          <p
            style={{ color: "#666", fontStyle: "italic", margin: "10px 0 0 0" }}
          >
            No hay turnos registrados para este mes.
          </p>
        )}
      </div>

      <div className="printable-area">
        {/* Header Card - Only visible in print */}

        {loading ? (
          <AgendaSkeleton />
        ) : (
          <>
            {sortedDates.length === 0 ? (
              <div
                className="card no-print"
                style={{ textAlign: "center", padding: "3rem", color: "#888" }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{
                    fontSize: "48px",
                    marginBottom: "1rem",
                    opacity: 0.5,
                  }}
                >
                  event_busy
                </span>
                <p style={{ fontSize: "1.1rem" }}>
                  {searchTerm
                    ? `No se encontraron turnos que coincidan con "${searchTerm}"`
                    : "No hay turnos registrados para este período."}
                </p>
              </div>
            ) : (
              sortedDates.map((dateKey) => (
                <div
                  key={dateKey}
                  className="card"
                  style={{
                    marginBottom: "1.5rem",
                    breakInside: "avoid",
                    overflow: "hidden",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1.1rem",
                      color: "#fff",
                      background: "var(--color-darkest)",
                      margin: "-1.5rem -1.5rem 1rem -1.5rem",
                      padding: "1rem 1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <span
                      className="material-symbols-rounded no-print"
                      style={{ fontSize: "1.2rem" }}
                    >
                      calendar_today
                    </span>
                    {new Date(dateKey + "T00:00:00")
                      .toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                      .replace(/^\w/, (c) => c.toUpperCase())}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.9rem",
                        opacity: 0.9,
                        fontWeight: "normal",
                      }}
                    >
                      {groupedAppointments[dateKey].length} turno
                      {groupedAppointments[dateKey].length !== 1 ? "s" : ""}
                    </span>
                  </h4>

                  <div
                    className="admin-table-container"
                    style={{ boxShadow: "none", marginTop: 0 }}
                  >
                    <table className="admin-table agenda-table">
                      <thead>
                        <tr>
                          <th style={{ width: "80px" }}>Hora</th>
                          <th>Cliente</th>
                          <th>Teléfono</th>
                          <th>Servicio</th>
                          <th className="no-print">Estado</th>
                          <th className="no-print">Recordatorio</th>
                          <th className="no-print">Acciones</th>
                          <th
                            className="print-only"
                            style={{ display: "none" }}
                          >
                            Firma
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Logic for Pagination */}
                        {(() => {
                          const dailyApps = groupedAppointments[dateKey];
                          const indexOfLastItem = currentPage * itemsPerPage;
                          const indexOfFirstItem =
                            indexOfLastItem - itemsPerPage;
                          // Only paginated for screen, all for print
                          // CSS media query handles hiding pagination controls, but we need to render ALL rows for print?
                          // Actually, if we paginate by slicing, the unexpected rows won't be in DOM.
                          // So we need:
                          // 1. Render PAGINATED list for Screen (@media screen)
                          // 2. Render FULL list for Print (@media print)
                          // Or simpler: Render ALL, hide excess with CSS? No, performance.
                          // Better: Since the user uses "Imprimir Lista" button which calls a helper function `printAgenda` utilizing the raw data `groupedAppointments`,
                          // we can safely paginate the DOM here because the custom print function doesn't rely on the DOM table rows!
                          // It relies on `groupedAppointments` passed to it.

                          const currentItems = dailyApps.slice(
                            indexOfFirstItem,
                            indexOfLastItem,
                          );

                          return currentItems.map((app) => (
                            <tr
                              key={app._id}
                              style={{
                                opacity: app.status === "cancelado" ? 0.5 : 1,
                              }}
                            >
                              <td
                                data-label="Hora"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  <span
                                    className="material-symbols-rounded"
                                    style={{ fontSize: "16px", color: "#666" }}
                                  >
                                    schedule
                                  </span>
                                  <strong>{app.time}</strong>
                                </div>
                              </td>
                              <td
                                data-label="Alumno"
                                style={{ fontWeight: "500" }}
                              >
                                {app.student?.name}
                              </td>
                              <td data-label="DNI" className="dni-cell">
                                {app.student?.dni}
                              </td>
                              <td data-label="Trámite">
                                <span
                                  style={{
                                    background: "#e2e8f0",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "0.85rem",
                                    color: "#475569",
                                  }}
                                >
                                  {app.service?.name}
                                </span>
                              </td>

                              <td className="no-print" data-label="Estado">
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.85rem",
                                    fontWeight: "bold",
                                    backgroundColor:
                                      app.status === "asistio"
                                        ? "#D4EDDA"
                                        : app.status === "cancelado"
                                          ? "#F8D7DA"
                                          : "#FFF3CD",
                                    color:
                                      app.status === "asistio"
                                        ? "#155724"
                                        : app.status === "cancelado"
                                          ? "#721C24"
                                          : "#856404",
                                    display: "inline-block",
                                  }}
                                >
                                  {app.status === "asistio"
                                    ? "Asistió"
                                    : app.status === "cancelado"
                                      ? "Cancelado"
                                      : "Pendiente"}
                                </span>
                              </td>
                              <td
                                className="no-print"
                                data-label="Recordatorio"
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      handleSendReminder(app, "email")
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "1.5rem",
                                      color: "#007bff",
                                      padding: "5px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "transform 0.2s",
                                      borderRadius: "50%",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.1)";
                                      e.target.style.backgroundColor =
                                        "#e6f0ff";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)";
                                      e.target.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Enviar recordatorio por Email"
                                  >
                                    <span className="material-symbols-rounded">
                                      mail
                                    </span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSendReminder(app, "whatsapp")
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "1.5rem",
                                      color: "#25D366",
                                      padding: "5px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "transform 0.2s",
                                      borderRadius: "50%",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.1)";
                                      e.target.style.backgroundColor =
                                        "#f0fdf4";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)";
                                      e.target.style.backgroundColor =
                                        "transparent";
                                    }}
                                    title="Enviar recordatorio por WhatsApp"
                                  >
                                    <span className="material-symbols-rounded">
                                      chat
                                    </span>
                                  </button>
                                </div>
                              </td>
                              <td className="no-print" data-label="Acciones">
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "5px",
                                    alignItems: "center",
                                  }}
                                >
                                  {app.status === "pendiente" ||
                                  app.status === "confirmado" ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(app._id, "asistio")
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          fontSize: "1.2rem",
                                          color: "#28a745",
                                          padding: "4px",
                                        }}
                                        title="Marcar Asistencia"
                                      >
                                        <span className="material-symbols-rounded">
                                          check_circle
                                        </span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleStatusChange(
                                            app._id,
                                            "cancelado",
                                          )
                                        }
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          fontSize: "1.2rem",
                                          color: "#dc3545",
                                          padding: "4px",
                                        }}
                                        title="Cancelar Turno"
                                      >
                                        <span className="material-symbols-rounded">
                                          cancel
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(
                                          app._id,
                                          "confirmado",
                                        )
                                      }
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "1.2rem",
                                        color: "#666",
                                        padding: "4px",
                                      }}
                                      title="Deshacer / Volver a Pendiente"
                                    >
                                      <span className="material-symbols-rounded">
                                        undo
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedAppointment(app);
                                      setRescheduleDate(app.date);
                                      setRescheduleModalOpen(true);
                                      fetchAvailableSlots(
                                        app.date,
                                        app.service._id,
                                      );
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "1.2rem",
                                      color: "#007bff",
                                      padding: "4px",
                                    }}
                                    title="Reprogramar"
                                  >
                                    <span className="material-symbols-rounded">
                                      edit_calendar
                                    </span>
                                  </button>
                                </div>
                              </td>
                              <td
                                className="print-only"
                                style={{
                                  borderBottom: "1px solid #ccc",
                                  height: "40px",
                                  width: "150px",
                                  display: "none",
                                }}
                              ></td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {groupedAppointments[dateKey].length > itemsPerPage && (
                    <div
                      className="pagination-controls no-print"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "1rem",
                        gap: "1rem",
                      }}
                    >
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "5px 10px" }}
                      >
                        Anterior
                      </button>
                      <span>
                        Página {currentPage} de{" "}
                        {Math.ceil(
                          groupedAppointments[dateKey].length / itemsPerPage,
                        )}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(
                                groupedAppointments[dateKey].length /
                                  itemsPerPage,
                              ),
                            ),
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(
                            groupedAppointments[dateKey].length / itemsPerPage,
                          )
                        }
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "5px 10px" }}
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          className="no-print"
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3 style={{ marginTop: 0, color: "var(--color-primary)" }}>
              Reprogramar Turno
            </h3>
            <p>
              Turno de <strong>{selectedAppointment?.student?.name}</strong>
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "0.9rem",
                }}
              >
                Nueva Fecha:
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  if (selectedAppointment) {
                    fetchAvailableSlots(
                      e.target.value,
                      selectedAppointment.service._id,
                    );
                  }
                }}
                className="admin-inp"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "0.9rem",
                }}
              >
                Nuevo Horario:
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                  gap: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      disabled={!slot.available}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border:
                          selectedSlot === slot.time
                            ? "2px solid var(--color-primary)"
                            : "1px solid #ddd",
                        background:
                          selectedSlot === slot.time
                            ? "var(--color-primary)"
                            : slot.available
                              ? "white"
                              : "#f5f5f5",
                        color:
                          selectedSlot === slot.time
                            ? "white"
                            : slot.available
                              ? "#333"
                              : "#aaa",
                        cursor: slot.available ? "pointer" : "not-allowed",
                        opacity: slot.available ? 1 : 0.6,
                      }}
                    >
                      {slot.time}
                    </button>
                  ))
                ) : (
                  <p style={{ color: "#666", gridColumn: "1/-1" }}>
                    Selecciona una fecha para ver horarios disponibles.
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setSelectedAppointment(null);
                  setAvailableSlots([]);
                  setSelectedSlot("");
                }}
                className="admin-btn"
                style={{ background: "#6c757d" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRescheduleConfirm}
                className="admin-btn"
                disabled={rescheduleLoading || !selectedSlot}
              >
                {rescheduleLoading ? "Guardando..." : "Confirmar Cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaView;
