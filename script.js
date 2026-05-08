/* ============================================================
 * 1. CONSTANTES
 *    Claves de localStorage y catálogo de categorías con sus colores
 * ============================================================ */

const CLAVE_USUARIOS    = 'gastosmart_usuarios';
const CLAVE_SESION      = 'gastosmart_sesion';
const CLAVE_GASTOS      = 'gastosmart_gastos';
const CLAVE_PRESUPUESTO = 'gastosmart_presupuesto';

const CATEGORIAS = {
  alimentacion:   { nombre: 'Alimentación',    fondo: '#d1f5e0', texto: '#1a7a3f' },
  transporte:     { nombre: 'Transporte',       fondo: '#d0e8ff', texto: '#1a4fa0' },
  entretenimiento:{ nombre: 'Entretenimiento',  fondo: '#f5e0ff', texto: '#6a1a9a' },
  salud:          { nombre: 'Salud',            fondo: '#ffe0e0', texto: '#9a1a1a' },
  educacion:      { nombre: 'Educación',        fondo: '#fff0d0', texto: '#7a4f00' },
  hogar:          { nombre: 'Hogar',            fondo: '#e0f5ff', texto: '#005f7a' },
  ropa:           { nombre: 'Ropa',             fondo: '#fce0ff', texto: '#7a006a' },
  otros:          { nombre: 'Otros',            fondo: '#fff3cd', texto: '#856404' },
};


/* ============================================================
 * 2. ALMACENAMIENTO (localStorage)
 *    Funciones puras de lectura/escritura por clave y por usuario
 * ============================================================ */

const obtenerSesion    = () => localStorage.getItem(CLAVE_SESION);
const guardarSesion    = correo => localStorage.setItem(CLAVE_SESION, correo);
const eliminarSesion   = () => localStorage.removeItem(CLAVE_SESION);

const obtenerUsuarios  = () => JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || '[]');
const guardarUsuarios  = lista => localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));

// Gastos y presupuesto se guardan particionados por correo de usuario
const leerParticion = clave => JSON.parse(localStorage.getItem(clave) || '{}');

const obtenerGastos = () => leerParticion(CLAVE_GASTOS)[obtenerSesion()] || [];
const guardarGastos = lista => {
  const todo = leerParticion(CLAVE_GASTOS);
  todo[obtenerSesion()] = lista;
  localStorage.setItem(CLAVE_GASTOS, JSON.stringify(todo));
};

const obtenerPresupuesto = () => leerParticion(CLAVE_PRESUPUESTO)[obtenerSesion()] || 0;
const guardarPresupuesto = valor => {
  const todo = leerParticion(CLAVE_PRESUPUESTO);
  todo[obtenerSesion()] = valor;
  localStorage.setItem(CLAVE_PRESUPUESTO, JSON.stringify(todo));
};


/* ============================================================
 * 3. UTILIDADES
 *    Generación de IDs, fechas y formatos de presentación
 * ============================================================ */

const generarId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Devuelve 'YYYY-MM' del mes en curso
const obtenerMesActual = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}`;
};

// Devuelve 'YYYY-MM-DD' de hoy para precargar el campo fecha
const obtenerFechaHoy = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

// Formatea número como moneda COP sin decimales: $1.500.000
const formatearMoneda = valor =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

// Convierte 'YYYY-MM-DD' a texto legible: '01 ene 2025'
const formatearFecha = fechaISO => {
  const [a, m, d] = fechaISO.split('-');
  return new Date(+a, +m - 1, +d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Capitaliza la primera letra de un string
const capitalizarPrimera = str => str.charAt(0).toUpperCase() + str.slice(1);

// Acceso seguro a un elemento del DOM
const el = id => document.getElementById(id);


/* ============================================================
 * 4. VALIDADORES
 *    Correo y contraseña con requisitos detallados
 * ============================================================ */

const validarCorreo = correo => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

// Devuelve { esValida, req } donde req describe cada requisito individualmente
const validarContrasena = contrasena => {
  const req = {
    longitud:  contrasena.length >= 8,
    mayuscula: /[A-Z]/.test(contrasena),
    numero:    /[0-9]/.test(contrasena),
    especial:  /[^A-Za-z0-9]/.test(contrasena),
  };
  return { esValida: Object.values(req).every(Boolean), req };
};


/* ============================================================
 * 5. ALERTAS (SweetAlert2)
 *    Wrappers reutilizables para error, confirmación y toast
 * ============================================================ */

const mostrarError = (titulo, html) =>
  Swal.fire({
    icon: 'error',
    title: titulo,
    html,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#4f7ef7',
  });

const mostrarConfirmacion = (titulo, texto, colorConfirmar = '#4f7ef7') =>
  Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: colorConfirmar,
    cancelButtonColor: '#6c757d',
  });

const mostrarToast = titulo =>
  Swal.fire({
    icon: 'success',
    title: titulo,
    toast: true,
    position: 'top-end',
    timer: 2000,
    showConfirmButton: false,
  });


/* ============================================================
 * 6. AUTENTICACIÓN (Login / Registro)
 *    Se activa solo cuando existe el panel de login en el DOM
 * ============================================================ */

const toggleVisibilidadPassword = (idBtn, idCampo) => {
  const btn   = el(idBtn);
  const campo = el(idCampo);
  btn.addEventListener('click', () => {
    const esPassword = campo.type === 'password';
    campo.type = esPassword ? 'text' : 'password';
    btn.querySelector('i').className = esPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
  });
};

// Actualiza los indicadores visuales de requisitos en tiempo real
const actualizarIndicadoresContrasena = contrasena => {
  const { req } = validarContrasena(contrasena);
  [
    ['req-longitud',  req.longitud],
    ['req-mayuscula', req.mayuscula],
    ['req-numero',    req.numero],
    ['req-especial',  req.especial],
  ].forEach(([id, cumple]) => {
    const indicador = el(id);
    indicador.querySelector('i').className = cumple
      ? 'bi bi-check-circle-fill'
      : 'bi bi-x-circle-fill';
    indicador.classList.toggle('cumplido', cumple);
  });
};

const manejarLogin = () => {
  const correo    = el('loginCorreo').value.trim();
  const contrasena = el('loginContrasena').value;

  if (!correo || !contrasena)
    return mostrarError('Campos vacíos', 'Completa correo y contraseña.');
  if (!validarCorreo(correo))
    return mostrarError('Correo inválido', 'Ingresa un correo electrónico válido.');

  const usuario = obtenerUsuarios().find(u => u.correo === correo);
  if (!usuario || usuario.contrasena !== contrasena)
    return mostrarError('Error de acceso', 'Correo o contraseña incorrectos.');

  guardarSesion(correo);
  window.location.href = 'dashboard.html';
};

const manejarRegistro = () => {
  const correo    = el('registroCorreo').value.trim();
  const contrasena = el('registroContrasena').value;
  const confirmar  = el('registroConfirmar').value;

  if (!correo || !contrasena || !confirmar)
    return mostrarError('Campos vacíos', 'Completa todos los campos.');
  if (!validarCorreo(correo))
    return mostrarError('Correo inválido', 'Ingresa un correo electrónico válido.');

  const { esValida, req } = validarContrasena(contrasena);
  if (!esValida) {
    const faltantes = [
      !req.longitud  && 'Mínimo 8 caracteres',
      !req.mayuscula && 'Una letra mayúscula',
      !req.numero    && 'Un número',
      !req.especial  && 'Un carácter especial',
    ].filter(Boolean).map(m => `• ${m}`).join('<br>');
    return mostrarError('Contraseña insegura', 'Requisitos faltantes:<br>' + faltantes);
  }

  if (contrasena !== confirmar)
    return mostrarError('Error', 'Las contraseñas no coinciden.');

  const usuarios = obtenerUsuarios();
  if (usuarios.some(u => u.correo === correo))
    return mostrarError('Error', 'El correo ya está registrado.');

  guardarUsuarios([...usuarios, { correo, contrasena }]);

  Swal.fire({
    icon: 'success',
    title: '¡Cuenta creada!',
    text: 'Ya puedes iniciar sesión.',
    confirmButtonText: 'Ir al Login',
    confirmButtonColor: '#4f7ef7',
  }).then(() => {
    el('tab-login').click();
    ['registroCorreo', 'registroContrasena', 'registroConfirmar']
      .forEach(id => { el(id).value = ''; });
  });
};

const iniciarLogin = () => {
  // Redirigir si ya hay sesión activa
  if (obtenerSesion()) { window.location.href = 'dashboard.html'; return; }

  toggleVisibilidadPassword('btnOjoLogin', 'loginContrasena');
  toggleVisibilidadPassword('btnOjoRegistro', 'registroContrasena');

  el('registroContrasena').addEventListener('input', e =>
    actualizarIndicadoresContrasena(e.target.value)
  );
  el('btnIniciarSesion').addEventListener('click', manejarLogin);
  el('btnRegistrarse').addEventListener('click', manejarRegistro);
};


/* ============================================================
 * 7. ESTADO DEL DASHBOARD
 *    Variables compartidas entre las funciones del dashboard
 * ============================================================ */

let vistaActual = 'mes'; // 'mes' | 'historico'
let modalGasto  = null;
let modalPresup = null;


/* ============================================================
 * 8. RESUMEN (tarjetas superiores)
 *    Recalcula y muestra presupuesto, gasto, restante y registros
 * ============================================================ */

const actualizarResumen = (verificarExceso = false) => {
  const presupuesto = obtenerPresupuesto();
  const gastosMes   = obtenerGastos().filter(g => g.fecha.startsWith(obtenerMesActual()));
  const totalMes    = gastosMes.reduce((suma, g) => suma + g.monto, 0);
  const restante    = presupuesto - totalMes;

  el('valorPresupuesto').textContent = presupuesto ? formatearMoneda(presupuesto) : 'Sin definir';
  el('valorGastado').textContent     = formatearMoneda(totalMes);
  el('valorRestante').textContent    = presupuesto ? formatearMoneda(restante) : 'Sin definir';
  el('valorRegistros').textContent   = obtenerGastos().length;

  // Resaltar tarjeta en rojo si el presupuesto fue superado
  document.querySelector('.tarjeta-restante')
    .classList.toggle('tarjeta-excedida', presupuesto > 0 && restante < 0);

  if (verificarExceso && presupuesto && totalMes > presupuesto) {
    Swal.fire({
      icon: 'warning',
      title: '¡Presupuesto superado!',
      html: `Exceso de: <strong>${formatearMoneda(totalMes - presupuesto)}</strong>.`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#e74c3c',
      timer: 6000,
      timerProgressBar: true,
    });
  }
};


/* ============================================================
 * 9. TABLA DE GASTOS (render y filtros)
 *    Aplica todos los filtros activos y renderiza las filas
 * ============================================================ */

// Construye el HTML de una fila de la tabla
const construirFilaGasto = g => {
  const cat = CATEGORIAS[g.categoria] || CATEGORIAS.otros;
  return `
    <tr data-id="${g.id}">
      <td class="celda-fecha">${formatearFecha(g.fecha)}</td>
      <td class="celda-descripcion">${g.descripcion}</td>
      <td>
        <span class="etiqueta-categoria"
              style="background:${cat.fondo};color:${cat.texto}">
          ${cat.nombre}
        </span>
      </td>
      <td class="text-end celda-monto">${formatearMoneda(g.monto)}</td>
      <td class="text-center">
        <button class="btn btn-accion btn-editar"
                onclick="abrirModalEdicion('${g.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-accion btn-eliminar"
                onclick="manejarEliminarGasto('${g.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
};

const renderizarTabla = () => {
  const mes      = obtenerMesActual();
  const desc     = el('filtroDescripcion').value.trim().toLowerCase();
  const cat      = el('filtroCategoria').value;
  const desde    = el('filtroFechaDesde').value;
  const hasta    = el('filtroFechaHasta').value;
  const maxMonto = parseFloat(el('filtroMontoMax').value);

  let gastos = obtenerGastos();

  // Filtro de vista: mes actual vs. histórico completo
  if (vistaActual === 'mes') gastos = gastos.filter(g => g.fecha.startsWith(mes));

  // Filtros del panel
  if (desc)                          gastos = gastos.filter(g => g.descripcion.toLowerCase().includes(desc));
  if (cat)                           gastos = gastos.filter(g => g.categoria === cat);
  if (desde)                         gastos = gastos.filter(g => g.fecha >= desde);
  if (hasta)                         gastos = gastos.filter(g => g.fecha <= hasta);
  if (!isNaN(maxMonto) && maxMonto > 0) gastos = gastos.filter(g => g.monto <= maxMonto);

  // Orden descendente por fecha
  gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  const total = gastos.length;
  el('contadorFiltrados').textContent = `${total} ${total === 1 ? 'registro' : 'registros'}`;

  const cuerpo = el('cuerpoTablaGastos');
  const vacio  = el('estadoVacio');

  if (!total) {
    cuerpo.innerHTML = '';
    vacio.classList.remove('d-none');
    return;
  }

  vacio.classList.add('d-none');
  cuerpo.innerHTML = gastos.map(construirFilaGasto).join('');
};

const limpiarFiltros = () => {
  ['filtroDescripcion', 'filtroCategoria', 'filtroFechaDesde', 'filtroFechaHasta', 'filtroMontoMax']
    .forEach(id => { el(id).value = ''; });
  renderizarTabla();
};


/* ============================================================
 * 10. CRUD GASTOS (modal registrar / editar / eliminar)
 * ============================================================ */

const limpiarFormularioGasto = () => {
  ['gastoId', 'gastoDescripcion', 'gastoCategoria', 'gastoMonto', 'gastoFecha']
    .forEach(id => { el(id).value = ''; });
};

const abrirModalNuevoGasto = () => {
  limpiarFormularioGasto();
  el('tituloModalGasto').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Gasto';
  el('gastoFecha').value = obtenerFechaHoy();
  modalGasto.show();
};

const abrirModalEdicion = idGasto => {
  const gasto = obtenerGastos().find(g => g.id === idGasto);
  if (!gasto) return;

  el('tituloModalGasto').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Gasto';
  el('gastoId').value          = gasto.id;
  el('gastoDescripcion').value = gasto.descripcion;
  el('gastoCategoria').value   = gasto.categoria;
  el('gastoMonto').value       = gasto.monto;
  el('gastoFecha').value       = gasto.fecha;
  modalGasto.show();
};

const manejarGuardarGasto = () => {
  const idGasto    = el('gastoId').value.trim();
  const descripcion = el('gastoDescripcion').value.trim();
  const categoria  = el('gastoCategoria').value;
  const montoTexto = el('gastoMonto').value;
  const fecha      = el('gastoFecha').value;
  const monto      = parseFloat(montoTexto);

  // Validaciones en orden de importancia
  if (!descripcion)              return mostrarError('Campo requerido', 'La <strong>Descripción</strong> no puede estar vacía.');
  if (descripcion.length < 8)   return mostrarError('Descripción corta', 'La descripción debe tener al menos 8 caracteres.');
  if (!categoria)                return mostrarError('Campo requerido', 'Debes seleccionar una <strong>Categoría</strong>.');
  if (!montoTexto)               return mostrarError('Campo requerido', 'El <strong>Monto</strong> es obligatorio.');
  if (isNaN(monto) || monto <= 0) return mostrarError('Monto inválido', 'El monto debe ser mayor a cero.');
  if (!fecha)                    return mostrarError('Campo requerido', 'La <strong>Fecha</strong> es obligatoria.');

  const esEdicion = idGasto !== '';

  mostrarConfirmacion(
    '¿Confirmar?',
    `¿Deseas ${esEdicion ? 'actualizar' : 'registrar'} este gasto?`
  ).then(({ isConfirmed }) => {
    if (!isConfirmed) return;

    const gastos = obtenerGastos();

    if (esEdicion) {
      // Modo edición: reemplazar el gasto existente
      const indice = gastos.findIndex(g => g.id === idGasto);
      if (indice !== -1) gastos[indice] = { ...gastos[indice], descripcion, categoria, monto, fecha };
    } else {
      // Modo nuevo: agregar con ID único
      gastos.push({ id: generarId(), descripcion, categoria, monto, fecha });
    }

    guardarGastos(gastos);
    modalGasto.hide();
    actualizarResumen(true);
    renderizarTabla();
    mostrarToast(esEdicion ? '¡Actualizado!' : '¡Registrado!');
  });
};

const manejarEliminarGasto = idGasto => {
  const lista = obtenerGastos();
  const gasto = lista.find(g => g.id === idGasto);
  if (!gasto) return;

  const cat = CATEGORIAS[gasto.categoria] || CATEGORIAS.otros;

  Swal.fire({
    icon: 'warning',
    title: 'Eliminar gasto',
    html: `
      <div style="text-align:left;background:#f8f9fa;padding:15px;border-radius:8px;border:1px solid #dee2e6">
        <p><strong>Descripción:</strong> ${gasto.descripcion}</p>
        <p><strong>Categoría:</strong>
          <span style="background:${cat.fondo};color:${cat.texto};padding:2px 10px;border-radius:20px">
            ${cat.nombre}
          </span>
        </p>
        <p><strong>Monto:</strong> ${formatearMoneda(gasto.monto)}</p>
        <p><strong>Fecha:</strong> ${formatearFecha(gasto.fecha)}</p>
      </div>
      <p class="text-danger mt-3">¿Estás seguro de que deseas eliminar este registro?</p>`,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
  }).then(({ isConfirmed }) => {
    if (!isConfirmed) return;
    guardarGastos(lista.filter(g => g.id !== idGasto));
    actualizarResumen();
    renderizarTabla();
    mostrarToast('Gasto eliminado');
  });
};


/* ============================================================
 * 11. PRESUPUESTO
 *    Modal para configurar o editar el presupuesto mensual
 * ============================================================ */

const abrirModalPresupuesto = () => {
  el('inputPresupuesto').value = obtenerPresupuesto() || '';
  modalPresup.show();
};

const manejarGuardarPresupuesto = () => {
  const valor = parseFloat(el('inputPresupuesto').value);
  if (!valor || valor <= 0)
    return mostrarError('Error', 'Ingresa un monto válido mayor a cero.');

  guardarPresupuesto(valor);
  modalPresup.hide();
  actualizarResumen();
  mostrarToast('Presupuesto guardado');
};


/* ============================================================
 * 12. SESIÓN
 *    Cierre de sesión con confirmación
 * ============================================================ */

const manejarCerrarSesion = () => {
  mostrarConfirmacion('Cerrar sesión', '¿Estás seguro de que deseas salir?', '#e74c3c')
    .then(({ isConfirmed }) => {
      if (isConfirmed) {
        eliminarSesion();
        window.location.href = 'index.html';
      }
    });
};


/* ============================================================
 * 13. INICIALIZACIÓN DEL DASHBOARD
 *    Arranca el dashboard: sesión, cabecera, modales, selects,
 *    resumen, tabla y todos los event listeners
 * ============================================================ */

const poblarSelectCategorias = () => {
  const opciones = Object.entries(CATEGORIAS)
    .map(([val, { nombre }]) => `<option value="${val}">${nombre}</option>`)
    .join('');
  el('gastoCategoria').innerHTML  = `<option value="">Selecciona una categoría</option>${opciones}`;
  el('filtroCategoria').innerHTML = `<option value="">Todas</option>${opciones}`;
};

const registrarListenersDashboard = () => {
  el('btnCerrarSesion').addEventListener('click', manejarCerrarSesion);
  el('btnAbrirModalGasto').addEventListener('click', abrirModalNuevoGasto);
  el('btnGuardarGasto').addEventListener('click', manejarGuardarGasto);
  el('btnEditarPresupuesto').addEventListener('click', abrirModalPresupuesto);
  el('btnGuardarPresupuesto').addEventListener('click', manejarGuardarPresupuesto);
  el('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);
  el('modalGasto').addEventListener('hidden.bs.modal', limpiarFormularioGasto);

  // Selector de vista: mes actual vs. histórico
  document.querySelectorAll('input[name="vistaGastos"]').forEach(radio =>
    radio.addEventListener('change', e => {
      vistaActual = e.target.value;
      el('tituloTabla').textContent =
        vistaActual === 'mes' ? 'Gastos del mes actual' : 'Historial completo';
      renderizarTabla();
    })
  );

  // Filtros reactivos: re-renderizar tabla al cambiar cualquier filtro
  ['filtroDescripcion', 'filtroFechaDesde', 'filtroFechaHasta', 'filtroMontoMax']
    .forEach(id => el(id).addEventListener('input', renderizarTabla));
  ['input', 'change']
    .forEach(ev => el('filtroCategoria').addEventListener(ev, renderizarTabla));
};

const iniciarDashboard = () => {
  const correo = obtenerSesion();
  if (!correo) { window.location.href = 'index.html'; return; }

  // Mostrar correo y mes en la barra de navegación
  el('textoUsuario').textContent = correo;
  const mesTexto = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  el('textoMes').textContent = capitalizarPrimera(mesTexto);

  // Inicializar instancias de modales Bootstrap
  modalGasto  = new bootstrap.Modal(el('modalGasto'));
  modalPresup = new bootstrap.Modal(el('modalPresupuesto'));

  poblarSelectCategorias();
  registrarListenersDashboard();
  actualizarResumen();
  renderizarTabla();

  // Si no hay presupuesto configurado, solicitar al usuario que lo defina
  if (!obtenerPresupuesto()) {
    setTimeout(() =>
      Swal.fire({
        icon: 'info',
        title: '¡Bienvenido!',
        text: 'Configura tu presupuesto mensual para comenzar.',
        confirmButtonText: 'Configurar',
        confirmButtonColor: '#4f7ef7',
      }).then(abrirModalPresupuesto),
    400);
  }
};


/* ============================================================
 * 14. EXPOSICIÓN GLOBAL
 *    Necesario para los onclick inline generados dinámicamente
 *    en la tabla (no pueden usar addEventListener directo)
 * ============================================================ */

window.abrirModalEdicion    = abrirModalEdicion;
window.manejarEliminarGasto = manejarEliminarGasto;


/* ============================================================
 * 15. ARRANQUE
 *    Detecta en qué página estamos y lanza el módulo correcto
 * ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (el('cuerpoTablaGastos')) iniciarDashboard();
  else if (el('panel-login'))  iniciarLogin();
});