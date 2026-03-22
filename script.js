/**
 * Configuración y Constantes
 */
const CLAVE_USUARIOS = "gastosmart_usuarios";
const CLAVE_SESION = "gastosmart_sesion";
const CLAVE_GASTOS = "gastosmart_gastos";
const CLAVE_PRESUPUESTO = "gastosmart_presupuesto";

const CATEGORIAS = {
    alimentacion:    { nombre: "Alimentación",    fondo: "#d1f5e0", texto: "#1a7a3f" },
    transporte:      { nombre: "Transporte",       fondo: "#d0e8ff", texto: "#1a4fa0" },
    entretenimiento: { nombre: "Entretenimiento",  fondo: "#f5e0ff", texto: "#6a1a9a" },
    salud:           { nombre: "Salud",            fondo: "#ffe0e0", texto: "#9a1a1a" },
    educacion:       { nombre: "Educación",        fondo: "#fff0d0", texto: "#7a4f00" },
    hogar:           { nombre: "Hogar",            fondo: "#e0f5ff", texto: "#005f7a" },
    ropa:            { nombre: "Ropa",             fondo: "#fce0ff", texto: "#7a006a" },
    otros:           { nombre: "Otros",            fondo: "#fff3cd", texto: "#856404" },
};

/**
 * Utilidades de Almacenamiento y Sesión
 */
const generarId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const obtenerSesion = () => localStorage.getItem(CLAVE_SESION);
const guardarSesion = (correo) => localStorage.setItem(CLAVE_SESION, correo);
const cerrarSesion = () => localStorage.removeItem(CLAVE_SESION);

const obtenerUsuarios = () => JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");
const guardarUsuarios = (lista) => localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista));

const obtenerGastos = () => {
    const todos = JSON.parse(localStorage.getItem(CLAVE_GASTOS) || "{}");
    return todos[obtenerSesion()] || [];
};

const guardarGastos = (lista) => {
    const todos = JSON.parse(localStorage.getItem(CLAVE_GASTOS) || "{}");
    todos[obtenerSesion()] = lista;
    localStorage.setItem(CLAVE_GASTOS, JSON.stringify(todos));
};

const obtenerPresupuesto = () => {
    const todos = JSON.parse(localStorage.getItem(CLAVE_PRESUPUESTO) || "{}");
    return todos[obtenerSesion()] || 0;
};

const guardarPresupuesto = (valor) => {
    const todos = JSON.parse(localStorage.getItem(CLAVE_PRESUPUESTO) || "{}");
    todos[obtenerSesion()] = valor;
    localStorage.setItem(CLAVE_PRESUPUESTO, JSON.stringify(todos));
};

/**
 * Formateadores y Validadores
 */
function formatearMoneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearFecha(fechaIso) {
    const [a, m, d] = fechaIso.split("-");
    return new Date(+a, +m - 1, +d).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

const obtenerMesActual = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}`;
};

const obtenerFechaHoy = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
};

function validarContrasena(c) {
    const req = {
        longitud:  c.length >= 8,
        mayuscula: /[A-Z]/.test(c),
        numero:    /[0-9]/.test(c),
        especial:  /[^A-Za-z0-9]/.test(c),
    };
    return { esValida: Object.values(req).every(Boolean), req };
}

// BUG 1 CORREGIDO: acepta cualquier dominio, no solo @gmail.com
const validarCorreo = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

const mostrarError = (titulo, html) =>
    Swal.fire({ icon: "error", title: titulo, html, confirmButtonText: "Aceptar", confirmButtonColor: "#4f7ef7" });

const mostrarToast = (titulo) =>
    Swal.fire({ icon: "success", title: titulo, toast: true, position: "top-end", timer: 2000, showConfirmButton: false });

/**
 * Módulo de Autenticación
 */
function iniciarLogin() {
    if (obtenerSesion()) {
        window.location.href = "dashboard.html";
        return;
    }

    ["btnOjoLogin/loginContrasena", "btnOjoRegistro/registroContrasena"].forEach((par) => {
        const [idBtn, idCampo] = par.split("/");
        const btn = document.getElementById(idBtn);
        const campo = document.getElementById(idCampo);
        btn.addEventListener("click", () => {
            campo.type = campo.type === "text" ? "password" : "text";
            btn.querySelector("i").className = campo.type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
        });
    });

    document.getElementById("registroContrasena").addEventListener("input", function () {
        const { req } = validarContrasena(this.value);
        [
            ["req-longitud",  req.longitud],
            ["req-mayuscula", req.mayuscula],
            ["req-numero",    req.numero],
            ["req-especial",  req.especial]
        ].forEach(([id, ok]) => {
            const el = document.getElementById(id);
            el.querySelector("i").className = ok ? "bi bi-check-circle-fill" : "bi bi-x-circle-fill";
            el.classList.toggle("cumplido", ok);
        });
    });

    document.getElementById("btnIniciarSesion").addEventListener("click", () => {
        const correo = document.getElementById("loginCorreo").value.trim();
        const contrasena = document.getElementById("loginContrasena").value;

        if (!correo || !contrasena) return mostrarError("Campos vacíos", "Completa correo y contraseña.");
        if (!validarCorreo(correo)) return mostrarError("Correo inválido", "Ingresa un correo electrónico válido.");

        const usuario = obtenerUsuarios().find((u) => u.correo === correo);
        if (!usuario || usuario.contrasena !== contrasena)
            return mostrarError("Error de acceso", "Correo o contraseña incorrectos.");

        guardarSesion(correo);
        window.location.href = "dashboard.html";
    });

    document.getElementById("btnRegistrarse").addEventListener("click", () => {
        const correo = document.getElementById("registroCorreo").value.trim();
        const contrasena = document.getElementById("registroContrasena").value;
        const confirmar = document.getElementById("registroConfirmar").value;

        if (!correo || !contrasena || !confirmar) return mostrarError("Campos vacíos", "Completa todos los campos.");
        if (!validarCorreo(correo)) return mostrarError("Correo inválido", "Ingresa un correo electrónico válido.");

        const { esValida, req } = validarContrasena(contrasena);
        if (!esValida) {
            const faltantes = [
                !req.longitud  && "Mínimo 8 caracteres",
                !req.mayuscula && "Una letra mayúscula",
                !req.numero    && "Un número",
                !req.especial  && "Un carácter especial",
            ].filter(Boolean).map(m => `• ${m}`).join("<br>");
            return mostrarError("Contraseña insegura", "Requisitos faltantes:<br>" + faltantes);
        }

        if (contrasena !== confirmar) return mostrarError("Error", "Las contraseñas no coinciden.");

        const usuarios = obtenerUsuarios();
        if (usuarios.some((u) => u.correo === correo)) return mostrarError("Error", "El correo ya está registrado.");

        guardarUsuarios([...usuarios, { correo, contrasena }]);
        Swal.fire({
            icon: "success",
            title: "¡Cuenta creada!",
            text: "Ya puedes iniciar sesión.",
            confirmButtonText: "Ir al Login",
            confirmButtonColor: "#4f7ef7"
        }).then(() => {
            document.getElementById("tab-login").click();
            ["registroCorreo", "registroContrasena", "registroConfirmar"].forEach(id => document.getElementById(id).value = "");
        });
    });
}

/**
 * Módulo de Dashboard
 */
let vistaActual = "mes";
let modalGasto = null;
let modalPresup = null;

function iniciarDashboard() {
    const correo = obtenerSesion();
    if (!correo) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("textoUsuario").textContent = correo;
    const mesTexto = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    document.getElementById("textoMes").textContent = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);

    modalGasto = new bootstrap.Modal(document.getElementById("modalGasto"));
    modalPresup = new bootstrap.Modal(document.getElementById("modalPresupuesto"));

    const opciones = Object.entries(CATEGORIAS)
        .map(([val, { nombre }]) => `<option value="${val}">${nombre}</option>`)
        .join("");
    document.getElementById("gastoCategoria").innerHTML = `<option value="">Selecciona una categoría</option>${opciones}`;
    document.getElementById("filtroCategoria").innerHTML = `<option value="">Todas</option>${opciones}`;

    if (!obtenerPresupuesto()) {
        setTimeout(() =>
            Swal.fire({
                icon: "info",
                title: "¡Bienvenido!",
                text: "Configura tu presupuesto mensual para comenzar.",
                confirmButtonText: "Configurar",
                confirmButtonColor: "#4f7ef7"
            }).then(abrirModalPresupuesto), 400);
    }

    actualizarResumen();
    renderizarTabla();

    document.getElementById("btnCerrarSesion").addEventListener("click", manejarCerrarSesion);
    document.getElementById("btnAbrirModalGasto").addEventListener("click", abrirModalNuevoGasto);
    document.getElementById("btnGuardarGasto").addEventListener("click", manejarGuardarGasto);
    document.getElementById("btnEditarPresupuesto").addEventListener("click", abrirModalPresupuesto);
    document.getElementById("btnGuardarPresupuesto").addEventListener("click", manejarGuardarPresupuesto);
    document.getElementById("btnLimpiarFiltros").addEventListener("click", limpiarFiltros);
    document.getElementById("modalGasto").addEventListener("hidden.bs.modal", limpiarFormularioGasto);

    document.querySelectorAll('input[name="vistaGastos"]').forEach((r) =>
        r.addEventListener("change", (e) => {
            vistaActual = e.target.value;
            document.getElementById("tituloTabla").textContent = vistaActual === "mes" ? "Gastos del mes actual" : "Historial completo";
            renderizarTabla();
        })
    );

    ["filtroDescripcion", "filtroFechaDesde", "filtroFechaHasta", "filtroMontoMax"].forEach(id =>
        document.getElementById(id).addEventListener("input", renderizarTabla)
    );
    ["input", "change"].forEach(ev =>
        document.getElementById("filtroCategoria").addEventListener(ev, renderizarTabla)
    );
}

function actualizarResumen(verificarPresupuesto = false) {
    const presupuesto = obtenerPresupuesto();
    const mes = obtenerMesActual();
    const totalMes = obtenerGastos()
        .filter(g => g.fecha.startsWith(mes))
        .reduce((s, g) => s + g.monto, 0);
    const restante = presupuesto - totalMes;

    document.getElementById("valorPresupuesto").textContent = presupuesto ? formatearMoneda(presupuesto) : "Sin definir";
    document.getElementById("valorGastado").textContent = formatearMoneda(totalMes);
    document.getElementById("valorRestante").textContent = presupuesto ? formatearMoneda(restante) : "Sin definir";
    document.getElementById("valorRegistros").textContent = obtenerGastos().length;

    document.querySelector(".tarjeta-restante").classList.toggle("tarjeta-excedida", presupuesto > 0 && restante < 0);

    if (verificarPresupuesto && presupuesto && totalMes > presupuesto) {
        Swal.fire({
            icon: "warning",
            title: "¡Presupuesto superado!",
            html: `Exceso de: <strong>${formatearMoneda(totalMes - presupuesto)}</strong>.`,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#e74c3c",
            timer: 6000,
            timerProgressBar: true,
        });
    }
}

function renderizarTabla() {
    const mes = obtenerMesActual();
    let gastos = obtenerGastos();

    if (vistaActual === "mes") gastos = gastos.filter(g => g.fecha.startsWith(mes));

    const desc = document.getElementById("filtroDescripcion").value.trim().toLowerCase();
    const cat = document.getElementById("filtroCategoria").value;
    const desde = document.getElementById("filtroFechaDesde").value;
    const hasta = document.getElementById("filtroFechaHasta").value;
    const maxMonto = parseFloat(document.getElementById("filtroMontoMax").value);

    if (desc)  gastos = gastos.filter(g => g.descripcion.toLowerCase().includes(desc));
    if (cat)   gastos = gastos.filter(g => g.categoria === cat);
    if (desde) gastos = gastos.filter(g => g.fecha >= desde);
    if (hasta) gastos = gastos.filter(g => g.fecha <= hasta);
    if (!isNaN(maxMonto) && maxMonto > 0) gastos = gastos.filter(g => g.monto <= maxMonto);

    gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const n = gastos.length;
    document.getElementById("contadorFiltrados").textContent = `${n} ${n === 1 ? "registro" : "registros"}`;

    const cuerpo = document.getElementById("cuerpoTablaGastos");
    const vacio = document.getElementById("estadoVacio");

    if (!n) { cuerpo.innerHTML = ""; vacio.classList.remove("d-none"); return; }
    vacio.classList.add("d-none");

    cuerpo.innerHTML = gastos.map((g) => {
        const c = CATEGORIAS[g.categoria] || CATEGORIAS.otros;
        return `
            <tr data-id="${g.id}">
                <td class="celda-fecha">${formatearFecha(g.fecha)}</td>
                <td class="celda-descripcion">${g.descripcion}</td>
                <td>
                    <span class="etiqueta-categoria" style="background:${c.fondo};color:${c.texto}">
                        ${c.nombre}
                    </span>
                </td>
                <td class="text-end celda-monto">${formatearMoneda(g.monto)}</td>
                <td class="text-center">
                    <button class="btn btn-accion btn-editar" onclick="abrirModalEdicion('${g.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-accion btn-eliminar" onclick="manejarEliminarGasto('${g.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
    }).join("");
}

function limpiarFiltros() {
    ["filtroDescripcion", "filtroCategoria", "filtroFechaDesde", "filtroFechaHasta", "filtroMontoMax"].forEach(id =>
        document.getElementById(id).value = ""
    );
    renderizarTabla();
}

/**
 * Gestión de Gastos (CRUD UI)
 */
function abrirModalNuevoGasto() {
    limpiarFormularioGasto();
    document.getElementById("tituloModalGasto").innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Gasto';
    document.getElementById("gastoFecha").value = obtenerFechaHoy();
    modalGasto.show();
}

function limpiarFormularioGasto() {
    ["gastoId", "gastoDescripcion", "gastoCategoria", "gastoMonto", "gastoFecha"].forEach(id =>
        document.getElementById(id).value = ""
    );
}

function abrirModalEdicion(idGasto) {
    const gasto = obtenerGastos().find(g => g.id === idGasto);
    if (!gasto) return;

    document.getElementById("tituloModalGasto").innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Gasto';
    document.getElementById("gastoId").value = gasto.id;
    document.getElementById("gastoDescripcion").value = gasto.descripcion;
    document.getElementById("gastoCategoria").value = gasto.categoria;
    document.getElementById("gastoMonto").value = gasto.monto;
    document.getElementById("gastoFecha").value = gasto.fecha;
    modalGasto.show();
}

function manejarGuardarGasto() {
    const idGasto = document.getElementById("gastoId").value.trim();
    const descripcion = document.getElementById("gastoDescripcion").value.trim();
    const categoria = document.getElementById("gastoCategoria").value;
    const montoTexto = document.getElementById("gastoMonto").value;
    const fecha = document.getElementById("gastoFecha").value;
    const monto = parseFloat(montoTexto);

    // BUG 2 CORREGIDO: validar campo a campo indicando cuál falta
    if (!descripcion) return mostrarError("Campo requerido", "La <strong>Descripción</strong> no puede estar vacía.");
    if (!categoria)   return mostrarError("Campo requerido", "Debes seleccionar una <strong>Categoría</strong>.");
    if (!montoTexto)  return mostrarError("Campo requerido", "El <strong>Monto</strong> es obligatorio.");
    if (!fecha)       return mostrarError("Campo requerido", "La <strong>Fecha</strong> es obligatoria.");

    if (descripcion.length < 8) return mostrarError("Descripción corta", "La descripción debe tener al menos 8 caracteres.");
    // BUG 3 CORREGIDO: mensaje claro sobre el monto
    if (isNaN(monto) || monto <= 0) return mostrarError("Monto inválido", "El monto debe ser mayor a cero.");

    const esEdicion = idGasto !== "";

    // BUG 4 CORREGIDO: cancelButtonText en español
    Swal.fire({
        icon: "question",
        title: "¿Confirmar?",
        text: `¿Deseas ${esEdicion ? "actualizar" : "registrar"} este gasto?`,
        showCancelButton: true,
        confirmButtonText: "Sí, guardar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4f7ef7",
        cancelButtonColor: "#6c757d",
    }).then(({ isConfirmed }) => {
        if (!isConfirmed) return;

        const gastos = obtenerGastos();
        if (esEdicion) {
            const i = gastos.findIndex(g => g.id === idGasto);
            if (i !== -1) gastos[i] = { ...gastos[i], descripcion, categoria, monto, fecha };
        } else {
            gastos.push({ id: generarId(), descripcion, categoria, monto, fecha });
        }

        guardarGastos(gastos);
        modalGasto.hide();
        actualizarResumen(true);
        renderizarTabla();
        mostrarToast(esEdicion ? "¡Actualizado!" : "¡Registrado!");
    });
}

function manejarEliminarGasto(idGasto) {
    const lista = obtenerGastos();
    const gasto = lista.find(g => g.id === idGasto);
    if (!gasto) return;

    // BUG 5 CORREGIDO: mostrar información completa del gasto
    const c = CATEGORIAS[gasto.categoria] || CATEGORIAS.otros;

    Swal.fire({
        icon: "warning",
        title: "Eliminar gasto",
        html: `
            <div style="text-align:left;background:#f8f9fa;padding:15px;border-radius:8px;border:1px solid #dee2e6">
                <p><strong>Descripción:</strong> ${gasto.descripcion}</p>
                <p><strong>Categoría:</strong>
                    <span style="background:${c.fondo};color:${c.texto};padding:2px 10px;border-radius:20px">
                        ${c.nombre}
                    </span>
                </p>
                <p><strong>Monto:</strong> ${formatearMoneda(gasto.monto)}</p>
                <p><strong>Fecha:</strong> ${formatearFecha(gasto.fecha)}</p>
            </div>
            <p class="text-danger mt-3">¿Estás seguro de que deseas eliminar este registro?</p>`,
        showCancelButton: true,
        // BUG 6 CORREGIDO: botones "Aceptar" y "Cancelar"
        confirmButtonText: "Aceptar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#6c757d",
    }).then(({ isConfirmed }) => {
        if (!isConfirmed) return;
        guardarGastos(lista.filter(g => g.id !== idGasto));
        actualizarResumen();
        renderizarTabla();
        // BUG 7 CORREGIDO: toast de éxito al eliminar
        mostrarToast("Gasto eliminado");
    });
}

/**
 * Gestión Presupuesto y Sesión
 */
function abrirModalPresupuesto() {
    document.getElementById("inputPresupuesto").value = obtenerPresupuesto() || "";
    modalPresup.show();
}

function manejarGuardarPresupuesto() {
    const valor = parseFloat(document.getElementById("inputPresupuesto").value);
    if (!valor || valor <= 0) return mostrarError("Error", "Ingresa un monto válido mayor a cero.");

    guardarPresupuesto(valor);
    modalPresup.hide();
    actualizarResumen();
    // BUG 8 CORREGIDO: toast de éxito al guardar presupuesto
    mostrarToast("Presupuesto guardado");
}

function manejarCerrarSesion() {
    Swal.fire({
        icon: "question",
        title: "Cerrar sesión",
        text: "¿Estás seguro?",
        showCancelButton: true,
        confirmButtonText: "Salir",
        // BUG 9 CORREGIDO: cancelButtonText en español
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e74c3c",
        cancelButtonColor: "#6c757d",
    }).then(({ isConfirmed }) => {
        if (isConfirmed) {
            cerrarSesion();
            window.location.href = "index.html";
        }
    });
}

/**
 * Inicialización según página
 */
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cuerpoTablaGastos")) iniciarDashboard();
    else if (document.getElementById("panel-login")) iniciarLogin();
});