import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import toast from "react-hot-toast";
import "../admin.css";
import "../skeleton.css";

const styles = {
  // ... existing styles ...
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  search: {
    padding: "0.6rem",
    width: "300px",
    fontSize: "0.95rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid #ddd",
  },
  table: { width: "100%", borderCollapse: "collapse" },
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
  // Modal de edición (más estrecho)
  modalContent: {
    background: "#fff",
    borderRadius: "var(--radius-lg)",
    width: "450px",
    maxWidth: "90%",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "var(--shadow-lg)",
    padding: 0,
  },
  // Modal de historial (más ancho)
  modalContentWide: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "var(--radius-lg)",
    width: "700px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "var(--shadow-lg)",
  },
  modalHeader: {
    background: "var(--color-primary)",
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
  sectionTitle: {
    borderBottom: "1px solid #eee",
    paddingBottom: "0.5rem",
    marginTop: "1.5rem",
    color: "var(--color-darkest)",
  },
  statCard: {
    background: "var(--color-bg)",
    padding: "1rem",
    borderRadius: "var(--radius-md)",
    textAlign: "center",
    flex: 1,
  },
  statsGrid: { display: "flex", gap: "15px", marginTop: "1rem" },
  modalCloseBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
  },
};

const ClientTableSkeleton = () => (
  <div
    className="skeleton-agenda-container"
    style={{ boxShadow: "none", padding: 0 }}
  >
    <div
      className="skeleton-table-header skeleton"
      style={{ marginBottom: "0" }}
    ></div>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="skeleton-row"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="skeleton-cell skeleton" style={{ width: "25%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "20%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "30%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "15%" }}></div>
      </div>
    ))}
  </div>
);

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    dni: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(searchTerm, page);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  const fetchClients = async (search = "", pageNum = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let url = `/clients?page=${pageNum}&limit=10`;
      if (search) url += `&search=${search}`;

      const response = await api.get(url, { headers });

      // Handle both legacy (array) and new (object) formats if roll-out is gradual,
      // but we know we just changed it to object.
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
        setTotalPages(response.meta?.pages || 1);
      } else if (Array.isArray(response)) {
        // Fallback just in case
        setClients(response);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al buscar tutores");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const data = await api.get(`/clients/${id}`, { headers });
      setSelectedClient(data);
      setShowModal(true);
    } catch (err) {
      toast.error("Error al cargar detalles");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      fullName: client.fullName,
      dni: client.dni,
      email: client.email,
      phone: client.phone,
    });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingClient(null);
    setFormData({ fullName: "", dni: "", email: "", phone: "" });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await api.put(`/clients/${editingClient._id}`, formData, { headers });
      toast.success("Tutor actualizado exitosamente");
      handleCloseEdit();
      fetchClients(searchTerm, page);
    } catch (err) {
      toast.error(
        "Error al actualizar tutor: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  return (
    <div>
      <div className="admin-header-controls">
        <h2 className="admin-page-title">Base de Clientes</h2>
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-inp"
          style={{ width: "300px", maxWidth: "100%" }}
        />
      </div>

      <div className="card">
        {loading ? (
          <ClientTableSkeleton />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Contacto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((client) => (
                    <tr key={client._id}>
                      <td data-label="Nombre">
                        <strong>{client.fullName}</strong>
                      </td>
                      <td data-label="Teléfono">{client.phone}</td>
                      <td data-label="Email">{client.email}</td>
                      <td data-label="Acciones">
                        <button
                          onClick={() => handleViewDetails(client._id)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "5px", marginRight: "5px" }}
                          title="Ver Historial"
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{
                              fontSize: "1.2rem",
                              color: "var(--color-secondary)",
                            }}
                          >
                            visibility
                          </span>
                        </button>
                        <button
                          onClick={() => handleEdit(client)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "5px" }}
                          title="Editar Cliente"
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{ fontSize: "1.2rem",  color: "var(--color-secondary)"}}
                          >
                            edit
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                {clients.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#999",
                      }}
                    >
                      No se encontraron clientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={{
            ...styles.actionBtn,
            opacity: page === 1 ? 0.5 : 1,
            cursor: page === 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span className="material-symbols-rounded">chevron_left</span>{" "}
          Anterior
        </button>
        <span style={{ color: "#666", fontWeight: 500 }}>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={{
            ...styles.actionBtn,
            opacity: page >= totalPages ? 0.5 : 1,
            cursor: page >= totalPages ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          Siguiente{" "}
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      {showModal && selectedClient && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContentWide, position: "relative" }}>
            <button onClick={handleCloseModal} style={styles.modalCloseBtn}>
              <span className="material-symbols-rounded">close</span>
            </button>
            <h2 style={{ margin: 0, color: "var(--color-darkest)" }}>
              {selectedClient.client.fullName}
            </h2>
            <p style={{ margin: "5px 0", color: "#666" }}>
              Telefono: {selectedClient.client.phone} | {selectedClient.client.email}
            </p>

            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {selectedClient.stats.total}
                </div>
                <div style={{ fontSize: "0.8rem" }}>Turnos Totales</div>
              </div>
              <div
                style={{
                  ...styles.statCard,
                  background: "#D4EDDA",
                  color: "#155724",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {selectedClient.stats.attended}
                </div>
                <div style={{ fontSize: "0.8rem" }}>Asistidos</div>
              </div>
              <div
                style={{
                  ...styles.statCard,
                  background: "#F8D7DA",
                  color: "#721C24",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                  {selectedClient.stats.cancelled}
                </div>
                <div style={{ fontSize: "0.8rem" }}>Cancelados</div>
              </div>
            </div>

            <h3 style={styles.sectionTitle}>Historial de Turnos</h3>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Servicio</th>
                    <th style={styles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClient.history.map((app) => (
                    <tr key={app._id}>
                      <td style={styles.td}>
                        {app.date} {app.time}
                      </td>
                      <td style={styles.td}>{app.student?.name}</td>
                      <td style={styles.td}>{app.service?.name}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            fontWeight: "bold",
                            textTransform: "capitalize",
                            color:
                              app.status === "asistio"
                                ? "green"
                                : app.status === "cancelado"
                                  ? "red"
                                  : "orange",
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {selectedClient.history.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ textAlign: "center", padding: "1rem" }}
                      >
                        Sin historial
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && editingClient && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalHeader}>Editar Tutor</h3>
            <div style={styles.modalBody}>
              <form onSubmit={handleSubmitEdit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre Completo</label>
                  <input
                    type="text"
                    className="input"
                    style={styles.input}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                    minLength={3}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>DNI</label>
                  <input
                    type="text"
                    className="input"
                    style={styles.input}
                    value={formData.dni}
                    onChange={(e) => {
                      // Solo números
                      if (/^\d*$/.test(e.target.value)) {
                        setFormData({ ...formData, dni: e.target.value });
                      }
                    }}
                    required
                    maxLength={8}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    className="input"
                    style={styles.input}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="tel"
                    className="input"
                    style={styles.input}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="+54 9 3814123456"
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
                    onClick={handleCloseEdit}
                    className="btn"
                    style={{ background: "#ccc" }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
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

export default ClientList;
