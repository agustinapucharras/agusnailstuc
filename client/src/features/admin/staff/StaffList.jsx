import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
  select: { width: "100%", padding: "0.7rem" },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  passwordGroup: { position: "relative" },
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#666",
    padding: "5px",
    display: "flex",
    alignItems: "center",
  },
};

const StaffTableSkeleton = () => (
  <div
    className="skeleton-agenda-container"
    style={{ boxShadow: "none", padding: 0 }}
  >
    <div
      className="skeleton-table-header skeleton"
      style={{ marginBottom: "0" }}
    ></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="skeleton-row"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="skeleton-cell skeleton" style={{ width: "20%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "25%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "15%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "15%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "10%" }}></div>
        <div className="skeleton-cell skeleton" style={{ width: "15%" }}></div>
      </div>
    ))}
  </div>
);

const StaffList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    role: "staff",
    workShift: "Mañana",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const data = await api.get("/employees", { headers });
      setEmployees(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        username: employee.username || "",
        password: "", // Dejar vacío por seguridad, se llenará solo si se quiere cambiar
        phone: employee.phone || "",
        role: employee.role,
        workShift: employee.workShift,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        role: "staff",
        workShift: "Mañana",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Preparar datos
      const dataToSend = { ...formData };

      // Si estamos editando y el password está vacío, no enviarlo (no cambiar contraseña)
      if (editingEmployee && !formData.password) {
        delete dataToSend.password;
      }

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, dataToSend, {
          headers,
        });
        toast.success("Empleado actualizado");
      } else {
        await api.post("/employees", dataToSend, { headers });
        toast.success("Empleado creado");
      }
      handleCloseModal();
      fetchEmployees();
    } catch (err) {
      toast.error("Error al guardar: " + err.message);
    }
  };

  const handleToggleStatus = async (employee) => {
    const action = employee.isActive ? "desactivar" : "activar";
    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} empleado?`,
      text: `¿Estás seguro de ${action} a ${employee.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: employee.isActive ? "#f0ad4e" : "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await api.patch(`/employees/${employee._id}/toggle`, {}, { headers });

      Swal.fire({
        title: "¡Éxito!",
        text: `Empleado ${employee.isActive ? "desactivado" : "activado"} correctamente`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchEmployees();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Hubo un error al procesar la solicitud",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleDelete = async (employee) => {
    const result = await Swal.fire({
      title: "¿Eliminar empleado?",
      text: `¿Estás seguro de eliminar a "${employee.name}"? Desaparecerá de la lista.`,
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
      await api.delete(`/employees/${employee._id}`, { headers });

      Swal.fire({
        title: "¡Eliminado!",
        text: "El empleado ha sido eliminado.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchEmployees();
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
        <h2 className="admin-page-title">Gestión de Personal</h2>
        <button
          onClick={() => handleOpenModal()}
          className="admin-btn admin-btn-primary"
        >
          <span className="material-symbols-rounded">add</span> Nuevo Empleado
        </button>
      </div>

      <div className="card">
        {loading ? (
          <StaffTableSkeleton />
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "22%", textAlign: "center" }}>Nombre</th>
                  <th style={{ width: "23%", textAlign: "center" }}>
                    Contacto
                  </th>
                  <th style={{ width: "15%", textAlign: "center" }}>Rol</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Horario</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Estado</th>
                  <th style={{ width: "15%", textAlign: "center" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} style={{ opacity: emp.isActive ? 1 : 0.6 }}>
                    <td data-label="Nombre">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--color-primary)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: "bold",
                          }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <strong
                          style={{
                            textTransform: "capitalize",
                            fontSize: "0.95rem",
                          }}
                        >
                          {emp.name}
                        </strong>
                      </div>
                    </td>
                    <td data-label="Contacto">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          width: "100%",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "500",
                            fontSize: "0.9rem",
                            maxWidth: "250px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={emp.email}
                        >
                          {emp.email}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#718096",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{ fontSize: "14px" }}
                          >
                            phone
                          </span>
                          {emp.phone}
                        </div>
                      </div>
                    </td>
                    <td data-label="Rol" style={{ textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background:
                            emp.role === "admin" ? "#EBF8FF" : "#F7FAFC",
                          color: emp.role === "admin" ? "#2B6CB0" : "#4A5568",
                          border: `1px solid ${emp.role === "admin" ? "#BEE3F8" : "#EDF2F7"}`,
                        }}
                      >
                        {emp.role === "admin" ? "ADMINISTRADOR" : "COLABORADOR"}
                      </span>
                    </td>
                    <td data-label="Horario">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          fontSize: "0.9rem",
                          color: "#4A5568",
                        }}
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "16px", color: "#A0AEC0" }}
                        >
                          schedule
                        </span>
                        {emp.workShift}
                      </div>
                    </td>
                    <td data-label="Estado" style={{ textAlign: "center" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          backgroundColor: emp.isActive ? "#C6F6D5" : "#FED7D7",
                          color: emp.isActive ? "#22543D" : "#822727",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "currentColor",
                          }}
                        ></span>
                        {emp.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleOpenModal(emp)}
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: "6px",
                            width: "32px",
                            height: "32px",
                          }}
                          title="Editar"
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{ fontSize: "1.1rem", color: "#4A5568" }}
                          >
                            edit
                          </span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: "6px",
                            width: "32px",
                            height: "32px",
                          }}
                          title={emp.isActive ? "Desactivar" : "Activar"}
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{
                              fontSize: "1.1rem",
                              color: emp.isActive ? "#D69E2E" : "#38A169",
                            }}
                          >
                            {emp.isActive ? "toggle_on" : "toggle_off"}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDelete(emp)}
                          className="admin-btn admin-btn-secondary"
                          style={{
                            padding: "6px",
                            width: "32px",
                            height: "32px",
                            background: "#FFF5F5",
                          }}
                          title="Eliminar"
                        >
                          <span
                            className="material-symbols-rounded"
                            style={{ fontSize: "1.1rem", color: "#E53E3E" }}
                          >
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "#A0AEC0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: "3rem", opacity: 0.5 }}
                        >
                          group_off
                        </span>
                        <p>No hay empleados registrados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalHeader}>
              {editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
            </h3>
            <div style={styles.modalBody}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre y Apellido</label>
                  <input
                    className="input"
                    style={styles.input}
                    value={formData.name}
                    onChange={(e) => {
                      // Allow only letters and spaces
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                        setFormData({ ...formData, name: e.target.value });
                      }
                    }}
                    required
                    minLength={3}
                  />
                  <small style={{ color: "#666", fontSize: "0.8rem" }}>
                    Solo letras y espacios
                  </small>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email (Login)</label>
                  <input
                    type="email"
                    className="input"
                    style={styles.input}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Debe contener un dominio válido (ej. usuario@dominio.com)"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Usuario</label>
                  <input
                    className="input"
                    style={styles.input}
                    value={formData.username}
                    onChange={(e) => {
                      // Solo alfanuméricos y guión bajo, convertir a minúsculas
                      const val = e.target.value.toLowerCase();
                      if (/^[a-z0-9_]*$/.test(val)) {
                        setFormData({ ...formData, username: val });
                      }
                    }}
                    required
                    minLength={4}
                    maxLength={20}
                    placeholder="ej: jperez"
                  />
                  <small style={{ color: "#666", fontSize: "0.8rem" }}>
                    Mínimo 4 caracteres, solo letras, números y guión bajo
                  </small>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Contraseña{" "}
                    {editingEmployee && (
                      <span
                        style={{ fontWeight: "normal", fontSize: "0.85rem" }}
                      >
                        (dejar vacío para no cambiar)
                      </span>
                    )}
                  </label>
                  <div style={styles.passwordGroup}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input"
                      style={{ ...styles.input, paddingRight: "40px" }}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingEmployee} // Obligatorio solo al crear
                      minLength={6}
                      placeholder={
                        editingEmployee ? "••••••" : "Mínimo 6 caracteres"
                      }
                    />
                    <button
                      type="button"
                      style={styles.eyeButton}
                      onClick={() => setShowPassword(!showPassword)}
                      title={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: "20px" }}
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {!editingEmployee && (
                    <small style={{ color: "#666", fontSize: "0.8rem" }}>
                      Mínimo 6 caracteres
                    </small>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    className="input"
                    style={styles.input}
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Ensure prefix exists
                      if (!val.startsWith("+54 9 ")) {
                        val =
                          "+54 9 " +
                          val.replace(/^\+54\s?9\s?/, "").replace(/\D/g, "");
                      }

                      const numberPart = val.slice(6); // get what's after "+54 9 "

                      // Allow only digits in the variable part and max 10 digits
                      if (/^\d*$/.test(numberPart) && numberPart.length <= 10) {
                        setFormData({ ...formData, phone: val });
                      }
                    }}
                    onFocus={(e) => {
                      if (!formData.phone)
                        setFormData({ ...formData, phone: "+54 9 " });
                    }}
                    placeholder="+54 9 XXXXXXXXXX"
                  />
                  <small style={{ color: "#666", fontSize: "0.8rem" }}>
                    Formato: +54 9 (cód. área sin 0) (número sin 15)
                  </small>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rol</label>
                  <select
                    className="input"
                    style={styles.select}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="staff">Colaborador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Franja Horaria</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="time"
                      className="input"
                      style={styles.input}
                      value={formData.workShift?.split(" - ")[0] || ""}
                      onChange={(e) => {
                        const end = formData.workShift?.split(" - ")[1] || "";
                        setFormData({
                          ...formData,
                          workShift: `${e.target.value} - ${end}`,
                        });
                      }}
                      required
                    />
                    <span> a </span>
                    <input
                      type="time"
                      className="input"
                      style={styles.input}
                      value={formData.workShift?.split(" - ")[1] || ""}
                      onChange={(e) => {
                        const start = formData.workShift?.split(" - ")[0] || "";
                        setFormData({
                          ...formData,
                          workShift: `${start} - ${e.target.value}`,
                        });
                      }}
                      required
                    />
                  </div>
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

export default StaffList;
