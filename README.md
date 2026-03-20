# sistema_turnos_matricula


PROPUESTA TÉCNICA Y DE SERVICIOS
SISTEMA INTEGRAL DE GESTIÓN DE TURNOS Y MATRICULACIÓN




















PRESENTADO A:
COLEGIO SANTÍSIMO ROSARIO
Objetivo del Proyecto:
Modernización Tecnológica, Optimización de Procesos Administrativos y Mejora de la Experiencia del Usuario.
Fecha de Emisión: 26 de Enero, 2026
Estado del Documento: Borrador de Propuesta v1.0
Clasificación: Confidencial / Uso Interno


1. Resumen Ejecutivo
El propósito del presente documento es detallar la propuesta técnica para la reingeniería y modernización del sistema de gestión de turnos para el proceso de matriculación del Colegio Santísimo Rosario.
La estrategia principal consiste en la migración de la solución actual, basada en complementos (plugins) de WordPress, hacia una Plataforma Web a Medida desarrollada sobre una arquitectura tecnológica moderna y escalable (Stack MERN). Esta iniciativa tiene como objetivos fundamentales eliminar la dependencia de licencias de terceros, optimizar el rendimiento de la plataforma para los usuarios finales y proveer al personal administrativo de herramientas eficaces para la generación de documentación física, garantizando así la integridad y fluidez del proceso de matriculación.
2. Análisis Comparativo: Situación Actual vs. Solución Propuesta
A continuación, se expone un análisis comparativo entre las limitaciones del sistema actual y las ventajas competitivas de la solución propuesta:
| Área de Impacto | Sistema Actual (Plugin WordPress) | Solución Propuesta (Desarrollo a Medida) | Beneficio Institucional |
| Experiencia de Usuario (UX) | Interfaz genérica con tiempos de carga elevados debido a la arquitectura monolítica de WordPress. | Diseño Responsivo (Mobile-First). Interfaz optimizada para dispositivos móviles con navegación intuitiva y tiempos de carga reducidos. | Disminución significativa de la tasa de abandono y reducción de consultas a soporte técnico. |
| Gestión de Concurrencia | Configuración rígida con riesgo de solapamiento de turnos ante alta demanda simultánea. | Algoritmo de Gestión de Concurrencia. Control estricto de intervalos de 5 minutos en tiempo real. | Integridad de Datos. Eliminación total del "Overbooking" y conflictos de agenda. |
| Operativa de Recepción | Carencia de herramientas nativas para reportes. Dependencia de exportaciones manuales a Excel o impresiones no optimizadas. | Módulo de Reportes de Asistencia. Generación automatizada de listados en formato PDF diseñados para la firma presencial. | Optimización de recursos (papel/tóner) y agilización del flujo de atención en ventanilla. |
| Soberanía de Datos | Información dispersa en estructuras de bases de datos compartidas. Dificultad en la extracción y análisis. | Base de Datos Dedicada (MongoDB). Estructura orientada al "Legajo Digital" del alumno, segura y escalable. | Propiedad intelectual y control total sobre la información institucional. |
| Sostenibilidad y Costos | Dependencia de licencias recurrentes y vulnerabilidad ante actualizaciones de la plataforma base. | Inversión Única. Adquisición del código fuente sin costos de licenciamiento perpetuo. | Estabilidad operativa y previsibilidad financiera a largo plazo. |
3. Alcance Funcional del Sistema
El sistema se estructurará en dos módulos principales diseñados para satisfacer los requerimientos específicos de cada perfil de usuario:
Módulo A: Portal de Autogestión (Usuarios Externos)
Plataforma web accesible desde cualquier dispositivo sin requerir instalación de software.
1.	Selección de Servicios: Interfaz clara para la selección del trámite correspondiente ("Matrícula 2026").
2.	Gestión de Disponibilidad:
○	Visualización restringida a los días habilitados por la administración.
○	Intervalos de 5 Minutos: Grilla dinámica que refleja la disponibilidad real en tiempo real (ej. 08:00, 08:05, 08:10), eliminando opciones ocupadas instantáneamente.
3.	Proceso de Reserva y Validación:
○	Formulario de captura de datos (Alumno, DNI, Tutor).
○	Validación lógica de DNI para prevención de registros duplicados.
4.	Sistema de Notificaciones:
○	Correo Electrónico: Envío automático de confirmación incluyendo la nómina de requisitos y documentación necesaria.
○	Mensajería (SMS/WhatsApp): Integración opcional para recordatorios automatizados.
Módulo B: Panel de Administración (Usuarios Internos)
Entorno de gestión exclusivo para el personal del colegio.
1.	Cuadro de Mando (Dashboard): Visualización de calendario con codificación cromática para el monitoreo de estados (Pendiente, Confirmado, Cancelado).
2.	Configuración de Agenda:
○	Gestión de días no laborables y feriados.
○	Ajuste flexible de franjas horarias de atención.
3.	Generación de Reportes de Firmas:
○	Funcionalidad para la emisión inmediata del reporte diario de turnos.
○	Formato optimizado para impresión: Tabla estructurada con Hora, Apellido, DNI y campo para firma del tutor.
○	Diseño minimalista para la reducción de costos de impresión.
4.	Historial y Auditoría: Búsqueda avanzada por DNI para la consulta de historial de turnos y asistencia.
4. Arquitectura Tecnológica y Seguridad
La solución se implementará utilizando el stack tecnológico MERN, un estándar de la industria reconocido por su rendimiento y escalabilidad:
●	Frontend (React.js): Garantiza una experiencia de usuario fluida y moderna (Single Page Application).
●	Backend (Node.js + Express): Servidor de alto rendimiento capaz de gestionar múltiples conexiones simultáneas, crucial para periodos de alta demanda.
●	Base de Datos (MongoDB): Sistema de base de datos NoSQL para el almacenamiento seguro y flexible de la información del alumnado.
Protocolos de Seguridad:
●	Encriptación de credenciales de acceso.
●	Implementación de medidas contra vulnerabilidades web comunes (CSRF, XSS).
●	Configuración de copias de seguridad (backups) automáticas.
5. Plan de Implementación
1.	Fase 1: Infraestructura y Datos. Diseño de la arquitectura de la base de datos y desarrollo de la lógica de negocio (intervalos de 5 minutos).
2.	Fase 2: Desarrollo Frontend Público. Implementación de las interfaces de reserva y experiencia de usuario para tutores.
3.	Fase 3: Desarrollo Panel Administrativo. Construcción de las herramientas de gestión interna y módulo de reportes.
4.	Fase 4: Aseguramiento de Calidad (QA). Migración de datos, pruebas de carga y validación integral del sistema.
5.	Fase 5: Despliegue y Capacitación. Puesta en producción, entrega del sistema y formación del personal administrativo.
6. Propuesta Económica y Condiciones Comerciales
En esta sección se detallan los costos de inversión para el desarrollo, así como las exclusiones y opciones de mantenimiento posterior.
6.1 Honorarios Profesionales
El costo total por el desarrollo, implementación y puesta en marcha del sistema descrito en esta propuesta es de:
$ 200.000 ARS (Doscientos mil pesos argentinos)
6.2 Exclusiones y Costos de Infraestructura
El monto de desarrollo cubre el diseño, programación y despliegue del software. No obstante, es responsabilidad del cliente cubrir los costos directos de servicios de terceros necesarios para la operatividad en internet:
●	Hosting / Alojamiento Web: El costo de contratación del servidor (hosting) corre por cuenta del cliente.
●	Dominio: El registro o renovación del nombre de dominio no está incluido.
●	Base de Datos (MongoDB): Se utilizará la versión gratuita ("Free Tier") de MongoDB Atlas. Tras el análisis técnico, se ha determinado que esta versión ofrece capacidad suficiente para el volumen de datos proyectado para el proceso de matriculación, por lo que no generará costos mensuales adicionales en esta etapa.
6.3 Servicio de Mantenimiento Post-Implementación (Opcional)
Una vez finalizado el periodo de garantía y puesta en marcha, el cliente podrá optar por contratar un servicio de abono mensual de mantenimiento. Este servicio es opcional y tiene como objetivo asegurar la continuidad operativa y actualización del sistema.
El abono de mantenimiento incluye:
●	Soporte técnico ante fallas o incidencias del sistema.
●	Actualizaciones de seguridad del servidor y librerías.
●	Modificaciones menores a demanda: actualización de textos, reemplazo de imágenes institucionales, cambios de fechas en la configuración o corrección de datos simples.
7. Conclusión
La implementación de este nuevo sistema trasciende la mera organización de turnos; representa una transformación digital del proceso administrativo.
Al eliminar la dependencia de soluciones genéricas, el Colegio Santísimo Rosario adquirirá una herramienta tecnológica diseñada específicamente para optimizar su flujo operativo (Recepción, Firma, Matriculación), garantizando orden, eficiencia y proyectando una imagen institucional de vanguardia ante la comunidad educativa.



Propuesta técnica elaborada por:
DevTuc
Servicios de Desarrollo de Software
📧 Contacto: devtuc25@gmail.com
