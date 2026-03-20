export const printAgenda = (groupedAppointments, periodString) => {
  // Use a hidden iframe to avoid opening a new window/tab
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  // Sort dates
  const sortedDates = Object.keys(groupedAppointments).sort();

  const getHtmlContent = () => {
    return sortedDates.map(dateKey => {
      const dateObj = new Date(dateKey + 'T00:00:00');
      const dateFormatted = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const dateFormattedCapitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      
      const appointments = groupedAppointments[dateKey];
      
      // Calculate Stats
      const total = appointments.length;
      const asistieron = appointments.filter(a => a.status === 'asistio').length;
      const pendientes = appointments.filter(a => a.status === 'pendiente' || a.status === 'confirmado').length;
      const cancelados = appointments.filter(a => a.status === 'cancelado').length;

      return `
        <div class="page-break">
          <div class="header">
            <div class="top-label">Estética</div>
            <h1>COLEGIO SANTÍSIMO ROSARIO</h1>
            <h2>${periodString === 'report' ? 'REPORTE DIARIO DE TURNOS' : 'Listado de Turnos y Matriculación'}</h2>
            <p class="system-label">Sistema de Gestión de Citas</p>
            <div class="date-header">
              Fecha: ${dateFormattedCapitalized}
            </div>
          </div>

          ${periodString === 'report' ? `
          <div class="summary-box">
             <div class="summary-item">
                <span class="summary-label">TOTAL TURNOS</span>
                <span class="summary-value">${total}</span>
             </div>
             <div class="summary-item">
                <span class="summary-label">ASISTIERON</span>
                <span class="summary-value">${asistieron}</span>
             </div>
             <div class="summary-item">
                <span class="summary-label">PENDIENTES / AUSENTES</span>
                <span class="summary-value">${pendientes}</span>
             </div>
             <div class="summary-item">
                <span class="summary-label">CANCELADOS</span>
                <span class="summary-value">${cancelados}</span>
             </div>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th style="width: 80px;">Hora</th>
                <th>Alumno (DNI)</th>
                <th>Solicitante</th>
                <th>Trámite</th>
                <th style="width: 150px;">${periodString === 'report' ? 'Estado' : 'Firma'}</th>
              </tr>
            </thead>
            <tbody>
              ${appointments
                .filter(app => app.status !== 'cancelado') // Excluir turnos cancelados de la lista de impresión
                .map(app => `
                <tr>
                  <td class="text-center font-bold">${app.time}</td>
                  <td>
                    <div class="student-name">${app.student?.name || '-'}</div>
                    <div class="student-dni">${app.student?.dni || '-'}</div>
                  </td>
                  <td>${app.client?.fullName || '-'}</td>
                  <td>${app.service?.name || '-'}</td>
                  <td class="text-center">
                    ${periodString === 'report' ? `
                        <span class="status-badge status-${app.status}">
                            ${app.status === 'asistio' ? 'ASISTIÓ' : 
                              app.status === 'cancelado' ? 'CANCELADO' : 
                              'PENDIENTE/AUSENTE'}
                        </span>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Generado el ${new Date().toLocaleString('es-ES')}
          </div>
        </div>
      `;
    }).join('');
  };

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Impresión de Agenda</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        body {
          font-family: 'Roboto', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1a202c;
          background: white;
        }

        .page-break {
          page-break-after: always;
          margin-bottom: 40px;
        }

        .header {
          text-align: center;
          margin-bottom: 25px;
        }

        .top-label {
          font-size: 10px;
          color: #666;
          text-align: right;
          margin-bottom: 10px;
        }

        h1 {
          color: #052659;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }

        h2 {
          color: #487874;
          font-size: 18px;
          font-weight: 600;
          margin: 5px 0;
        }

        .system-label {
          color: #999;
          font-size: 12px;
          margin: 2px 0 15px 0;
        }

        .date-header {
          border-bottom: 3px solid #052659;
          padding-bottom: 10px;
          font-size: 16px;
          font-weight: 700;
          color: #2d3748;
          margin-top: 15px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e0;
          margin-top: 20px;
        }

        thead {
          background-color: white;
        }

        th {
          border: 1px solid #a0aec0;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          color: #052659;
          text-transform: uppercase;
        }

        td {
          border: 1px solid #cbd5e0;
          padding: 10px 12px;
          font-size: 13px;
          color: #2d3748;
          vertical-align: middle;
        }

        .text-center {
          text-align: center;
        }

        .font-bold {
          font-weight: 700;
          color: #1a202c;
        }

        .student-name {
          font-weight: 600;
          color: #000;
        }

        .student-dni {
          font-size: 11px;
          color: #718096;
          margin-top: 2px;
        }

        .footer {
          margin-top: 30px;
          text-align: right;
          font-size: 10px;
          color: #cbd5e0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }

          .page-break {
            page-break-after: always;
            margin-bottom: 0;
            height: auto;
            min-height: 90vh; /* Ensure it takes up most of the page but not 100% to avoid overflow */
            display: block;
          }
          
          .page-break:last-child {
            page-break-after: auto;
            margin-bottom: 0;
          }

          .summary-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border: 1px solid #cbd5e0;
            border-radius: 8px;
            padding: 15px;
            background-color: #f7fafc;
          }
          
          .summary-item {
            text-align: center;
            flex: 1;
            border-right: 1px solid #e2e8f0;
          }
          
          .summary-item:last-child {
            border-right: none;
          }
          
          .summary-label {
            display: block;
            font-size: 11px;
            color: #718096;
            margin-bottom: 5px;
            font-weight: 700;
          }
          
          .summary-value {
            font-size: 18px;
            font-weight: 800;
            color: #2d3748;
          }

          .status-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
          }
          
          .status-asistio {
            background-color: #c6f6d5;
            color: #22543d;
            border: 1px solid #9ae6b4;
          }
          
          .status-cancelado {
            background-color: #fed7d7;
            color: #822727;
            border: 1px solid #feb2b2;
          }
          
          .status-pendiente, .status-confirmado {
            background-color: #bee3f8;
            color: #2a4365;
            border: 1px solid #90cdf4;
          }
        }
      </style>
    </head>
    <body>
      ${sortedDates.length > 0 ? getHtmlContent() : '<div style="text-align:center; padding: 50px; color: #666;">No hay turnos para imprimir en la fecha seleccionada.</div>'}
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to load then print
  iframe.onload = function() {
      setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Remove iframe after sufficient time for print dialog to initiate
          // Note: We can't strictly detect when print dialog closes in all browsers from an iframe, 
          // but leaving a 0x0 hidden iframe is harmless properly removed later or just kept hidden.
          // Removing it too early might kill the print dialog in some browsers.
          // A safe bet is to remove it after a long timeout or just leave it hidden.
          // For cleanliness, we'll remove it after 1 minute or on next print.
          setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
          }, 60000); 
      }, 500);
  };
};
