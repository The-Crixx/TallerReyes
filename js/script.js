const NOMBRE_TALLER = "SERVICIO REYES";
const TECNICO_PREDETERMINADO = "Carlos Reyes";
const TIENDA_PREDETERMINADA = "Servicio Reyes";
const PAIS_PREDETERMINADO = "Mexico";
const ESTADO_PREDETERMINADO = "Veracruz";

const LOGO_PREDETERMINADO = "img/logo.png";
const FIRMA_PREDETERMINADA = "assets/firma-responsable.png";

const PLACEHOLDER_LOGO = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="100%" height="100%" fill="#eff5fb"/><rect x="12" y="12" width="196" height="196" rx="16" fill="#dce8f5" stroke="#0d3b66"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI" font-size="26" fill="#0d3b66">LOGO</text></svg>'
);

const PLACEHOLDER_FIRMA = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120"><rect width="100%" height="100%" fill="#ffffff"/><path d="M18 80 C65 22 104 95 160 54 C199 27 226 103 280 61 C316 36 340 82 402 40" stroke="#2b2b2b" stroke-width="4" fill="none" stroke-linecap="round"/><text x="210" y="112" text-anchor="middle" font-family="Segoe UI" font-size="14" fill="#4a5565">Firma</text></svg>'
);

const PDF_COLORS = {
    textTitle: [31, 41, 55],
    textDark: [46, 55, 71],
    textBody: [71, 85, 105],
    lineSoft: [203, 213, 225],
    lineStrong: [156, 163, 175],
    cellFill: [249, 250, 251],
    accent: [127, 29, 29],
};

let imagenesBase64 = [];
let logoBase64 = PLACEHOLDER_LOGO;
let firmaBase64 = PLACEHOLDER_FIRMA;
let logoAspectRatio = 3;

inicializarRecursosVisuales();
generarPreview();

function textoSeguro(valor, respaldo = "No especificado") {
    const limpio = (valor || "").trim();
    return limpio || respaldo;
}

async function archivoABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function urlABase64(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("No se pudo cargar recurso");
        const blob = await resp.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

async function obtenerAspectoImagen(base64) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth || 1;
            const h = img.naturalHeight || 1;
            resolve(w / h);
        };
        img.onerror = () => resolve(3);
        img.src = base64;
    });
}

function obtenerIniciales(nombre) {
    return String(nombre || "")
        .split(" ")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase())
        .join("");
}

function formatoFechaArchivo() {
    const f = new Date();
    const ano = f.getFullYear();
    const mes = String(f.getMonth() + 1).padStart(2, "0");
    const dia = String(f.getDate()).padStart(2, "0");
    return `${ano}${mes}${dia}`;
}

function formatoFechaHoraLocal(fecha = new Date()) {
    const fechaTexto = fecha.toLocaleDateString("es-MX");
    const horaTexto = fecha.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    return `${fechaTexto} ${horaTexto}`;
}

function limpiarTexto(texto) {
    return String(texto || "").replace(/[^a-zA-Z0-9]/g, "_");
}

function crearFolio() {
    const modeloTexto = (modelo.value || "").trim();
    const clienteTexto = (cliente.value || "").trim();
    const anioTexto = (anio.value || "").trim();

    const inicialModelo = modeloTexto ? limpiarTexto(modeloTexto.charAt(0).toUpperCase()) : "X";
    const inicialesCliente = limpiarTexto(obtenerIniciales(clienteTexto || "Cliente")) || "CL";
    const anioFolio = limpiarTexto(anioTexto || "0000");
    const fecha = formatoFechaArchivo();

    return `${inicialModelo}${inicialesCliente}_${anioFolio}_${fecha}`;
}

function crearNumeroReporte() {
    return `RPT-${crearFolio()}`;
}

function aplicarCamposPredeterminados() {
    tecnico.value = TECNICO_PREDETERMINADO;
    tienda.value = TIENDA_PREDETERMINADA;
    pais.value = PAIS_PREDETERMINADO;
    estado.value = ESTADO_PREDETERMINADO;
}

async function inicializarRecursosVisuales() {
    document.getElementById("tallerNombre").textContent = NOMBRE_TALLER;
    aplicarCamposPredeterminados();

    logoBase64 = await urlABase64(LOGO_PREDETERMINADO) || PLACEHOLDER_LOGO;
    logoAspectRatio = await obtenerAspectoImagen(logoBase64);
    firmaBase64 = await urlABase64(FIRMA_PREDETERMINADA) || PLACEHOLDER_FIRMA;

    logoPreview.src = logoBase64;
    firmaPreview.src = firmaBase64;
}

document.getElementById("imagenes").addEventListener("change", async function(event) {
    const files = event.target.files;

    if (files.length > 10) {
        document.getElementById("errorImg").textContent = "Maximo 10 imagenes";
        this.value = "";
        imagenesBase64 = [];
        generarPreview();
        return;
    }

    document.getElementById("errorImg").textContent = "";
    imagenesBase64 = await Promise.all(Array.from(files).map(archivoABase64));
    generarPreview();
});

function actualizarIdentificadoresEnTiempoReal() {
    const fechaActual = new Date();
    const folio = crearFolio();
    const numeroReporte = crearNumeroReporte();

    document.getElementById("fecha").textContent = formatoFechaHoraLocal(fechaActual);
    document.getElementById("folio").textContent = folio;
    sn_reporte.value = numeroReporte;

    const salidaNumeroReporte = document.getElementById("p_sn_reporte");
    if (salidaNumeroReporte) {
        salidaNumeroReporte.textContent = numeroReporte;
    }
}

["cliente", "modelo", "anio"].forEach((idCampo) => {
    const campo = document.getElementById(idCampo);
    if (!campo) return;

    campo.addEventListener("input", actualizarIdentificadoresEnTiempoReal);
    campo.addEventListener("change", actualizarIdentificadoresEnTiempoReal);
});

function generarPreview() {
    actualizarIdentificadoresEnTiempoReal();
    const numeroReporte = sn_reporte.value;

    aplicarCamposPredeterminados();

    p_cliente.textContent = textoSeguro(cliente.value);
    p_telefono.textContent = textoSeguro(telefono.value);
    p_marca.textContent = textoSeguro(marca.value);
    p_modelo.textContent = textoSeguro(modelo.value);
    p_anio.textContent = textoSeguro(anio.value);
    p_placa_delantera.textContent = textoSeguro(placa_delantera.value);
    p_placa_trasera.textContent = textoSeguro(placa_trasera.value);
    p_kilometraje.textContent = textoSeguro(kilometraje.value);
    p_sn_reporte.textContent = numeroReporte;
    p_tecnico.textContent = TECNICO_PREDETERMINADO;
    p_tienda.textContent = TIENDA_PREDETERMINADA;
    p_pais.textContent = PAIS_PREDETERMINADO;
    p_estado.textContent = ESTADO_PREDETERMINADO;
    p_ciudad.textContent = textoSeguro(ciudad.value);
    p_obs.textContent = textoSeguro(observaciones.value, "Sin observaciones registradas.");
    p_obs.classList.add("obs-text");

    const contenedor = document.getElementById("contenedorImagenes");
    contenedor.innerHTML = "";

    const total = imagenesBase64.length;
    const columnas = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;
    const altoImagen = total <= 2 ? 140 : total <= 4 ? 120 : total <= 8 ? 95 : 82;
    contenedor.style.gridTemplateColumns = `repeat(${columnas}, minmax(0, 1fr))`;

    if (!imagenesBase64.length) {
        const aviso = document.createElement("p");
        aviso.className = "hint";
        aviso.textContent = "No hay imagenes cargadas aun.";
        contenedor.appendChild(aviso);
    }

    imagenesBase64.forEach((img) => {
        const image = document.createElement("img");
        image.src = img;
        image.className = "mini-image";
        image.style.height = `${altoImagen}px`;
        contenedor.appendChild(image);
    });

    logoPreview.src = logoBase64;
    firmaPreview.src = firmaBase64;
}

function textoEnUnaLinea(pdf, texto, anchoMax) {
    const valor = String(texto ?? "");
    const partes = pdf.splitTextToSize(valor, anchoMax);
    if (!partes.length) return "";
    return partes[0];
}

function drawSectionHeaderBar(pdf, x, y, w, texto) {
    pdf.setFont("courier", "bold");
    pdf.setTextColor(...PDF_COLORS.textTitle);
    pdf.setFontSize(10.2);
    pdf.text(texto, x + 1, y + 4.7);

    pdf.setDrawColor(...PDF_COLORS.lineSoft);
    pdf.line(x, y + 6.5, x + w, y + 6.5);
}

function drawGridBox(pdf, x, y, w, h, cols, rows) {
    pdf.setFillColor(...PDF_COLORS.cellFill);
    pdf.rect(x, y, w, h, "F");

    pdf.setDrawColor(...PDF_COLORS.lineSoft);
    pdf.rect(x, y, w, h);

    if (cols > 1) {
        const colW = w / cols;
        for (let i = 1; i < cols; i++) {
            const xx = x + (colW * i);
            pdf.line(xx, y, xx, y + h);
        }
    }

    if (rows > 1) {
        const rowH = h / rows;
        for (let i = 1; i < rows; i++) {
            const yy = y + (rowH * i);
            pdf.line(x, yy, x + w, yy);
        }
    }
}

function addHeader(pdf, fechaHoraTexto, folioTexto, data) {
    const margin = 12;
    const logoBoxW = 64;
    const logoBoxH = 18;
    const ratio = Math.max(0.5, Math.min(8, logoAspectRatio || 3));

    let logoW = logoBoxW;
    let logoH = logoW / ratio;
    if (logoH > logoBoxH) {
        logoH = logoBoxH;
        logoW = logoH * ratio;
    }

    const logoX = margin + 186 - logoW;
    const logoY = 10.5 + ((logoBoxH - logoH) / 2);
    const rightBlockX = 118;

    // Usa el mismo logo cargado para la vista previa.
    try {
        pdf.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
    } catch {
        // Si falla el recurso, omite logo sin romper el PDF.
    }

    pdf.setFont("courier", "bold");
    pdf.setTextColor(...PDF_COLORS.textTitle);
    pdf.setFontSize(15.5);
    pdf.text("Informe de recepcion", margin, 15.5);

    pdf.setFont("courier", "bold");
    pdf.setTextColor(...PDF_COLORS.textTitle);
    pdf.setFontSize(10.4);
    pdf.text(NOMBRE_TALLER, margin, 21);

    pdf.setFont("courier", "normal");
    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFontSize(8.9);
    pdf.text(`SN: ${data.snReporte}`, margin, 28);
    pdf.text(`Fecha y hora: ${fechaHoraTexto}`, margin, 33);
    pdf.text(`Cliente: ${textoEnUnaLinea(pdf, data.cliente, 96)}`, margin, 38);
    pdf.text(`Tecnico: ${textoEnUnaLinea(pdf, data.tecnico, 96)}`, margin, 43);

    pdf.text(`Folio: ${folioTexto}`, rightBlockX, 28);
    pdf.text(`Tienda: ${textoEnUnaLinea(pdf, data.tienda, 76)}`, rightBlockX, 33);
    pdf.text(`Telefono: ${textoEnUnaLinea(pdf, data.telefono, 76)}`, rightBlockX, 38);
    pdf.text(`Pais: ${textoEnUnaLinea(pdf, data.pais, 76)}`, rightBlockX, 43);

    pdf.setDrawColor(...PDF_COLORS.lineStrong);
    pdf.line(margin, 46, margin + 186, 46);
}

function addInfoBlock(pdf, y, data) {
    const x = 12;
    const w = 186;
    const gridY = y + 8;
    const gridH = 34;

    drawSectionHeaderBar(pdf, x, y, w, "Datos del cliente y unidad");
    drawGridBox(pdf, x, gridY, w, gridH, 2, 4);

    const colW = w / 2;
    const rowH = gridH / 4;

    const drawLabelValue = (col, row, label, valor) => {
        const left = x + (col * colW);
        const yy = gridY + (row * rowH) + 5.5;
        const etiqueta = `${label}:`;

        pdf.setFont("courier", "bold");
        pdf.setTextColor(...PDF_COLORS.textDark);
        pdf.setFontSize(8.7);
        pdf.text(etiqueta, left + 2, yy);

        const labelW = pdf.getTextWidth(etiqueta) + 2;
        const valueW = Math.max(10, colW - labelW - 6);

        pdf.setFont("courier", "normal");
        pdf.setTextColor(...PDF_COLORS.textBody);
        pdf.text(textoEnUnaLinea(pdf, valor, valueW), left + 2 + labelW, yy);
    };

    drawLabelValue(0, 0, "Cliente", data.cliente);
    drawLabelValue(1, 0, "Marca", data.marca);
    drawLabelValue(0, 1, "Telefono", data.telefono);
    drawLabelValue(1, 1, "Modelo", data.modelo);
    drawLabelValue(0, 2, "P. Delantera", data.placaDelantera);
    drawLabelValue(1, 2, "Ano", data.anio);
    drawLabelValue(0, 3, "Kilometraje", data.kilometraje);
    drawLabelValue(1, 3, "P. Trasera", data.placaTrasera);
}

function addUbicacionBlock(pdf, y, data) {
    const x = 12;
    const w = 186;
    const gridY = y + 8;
    const gridH = 18;

    drawSectionHeaderBar(pdf, x, y, w, "Datos de taller y ubicacion");
    drawGridBox(pdf, x, gridY, w, gridH, 2, 2);

    const colW = w / 2;
    const rowH = gridH / 2;

    const drawLabelValue = (col, row, label, valor) => {
        const left = x + (col * colW);
        const yy = gridY + (row * rowH) + 5.5;
        const etiqueta = `${label}:`;

        pdf.setFont("courier", "bold");
        pdf.setTextColor(...PDF_COLORS.textDark);
        pdf.setFontSize(8.7);
        pdf.text(etiqueta, left + 2, yy);

        const labelW = pdf.getTextWidth(etiqueta) + 2;
        const valueW = Math.max(10, colW - labelW - 6);

        pdf.setFont("courier", "normal");
        pdf.setTextColor(...PDF_COLORS.textBody);
        pdf.text(textoEnUnaLinea(pdf, valor, valueW), left + 2 + labelW, yy);
    };

    drawLabelValue(0, 0, "Tienda", data.tienda);
    drawLabelValue(1, 0, "Pais", data.pais);
    drawLabelValue(0, 1, "Estado", data.estado);
    drawLabelValue(1, 1, "Ciudad", data.ciudad);
}

function addObservaciones(pdf, y, texto) {
    const x = 12;
    const w = 186;
    const gridY = y + 8;
    const gridH = 22;

    drawSectionHeaderBar(pdf, x, y, w, "Observaciones de recepcion");
    drawGridBox(pdf, x, gridY, w, gridH, 1, 1);

    pdf.setFont("courier", "bold");
    pdf.setTextColor(...PDF_COLORS.textDark);
    pdf.setFontSize(8.8);
    pdf.text("Observaciones:", x + 2, gridY + 5.2);

    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFont("courier", "normal");
    pdf.setFontSize(8.4);
    const lineas = pdf.splitTextToSize(texto, 180);
    const maxLineas = 2;
    const resumidas = lineas.length > maxLineas
        ? [...lineas.slice(0, maxLineas - 1), `${lineas[maxLineas - 1]}...`]
        : lineas;
    pdf.text(resumidas, x + 2, gridY + 10.5);
}

function addFirmaFooter(pdf, y) {
    const centerX = 105;

    pdf.setDrawColor(...PDF_COLORS.lineStrong);
    pdf.line(centerX - 35, y + 16, centerX + 35, y + 16);

    try {
        pdf.addImage(firmaBase64, "PNG", centerX - 25, y, 50, 14);
    } catch {
        // Si hay error de formato de imagen, solo deja la linea y texto.
    }

    pdf.setTextColor(...PDF_COLORS.textDark);
    pdf.setFont("courier", "bold");
    pdf.setFontSize(9);
    pdf.text("Firma del responsable de recepcion", centerX, y + 21, { align: "center" });
}

function addPageNumber(pdf, numeroPagina) {
    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFont("courier", "normal");
    pdf.setFontSize(8.5);
    pdf.text(`Pagina ${numeroPagina}`, 198, 292, { align: "right" });
}

function obtenerLayoutImagenes(total) {
    if (total <= 0) return { cols: 1, rows: 1 };

    let mejor = { cols: 1, rows: total, celdas: total };
    for (let cols = 1; cols <= 5; cols++) {
        const rows = Math.ceil(total / cols);
        const celdas = rows * cols;
        if (celdas < mejor.celdas || (celdas === mejor.celdas && cols > mejor.cols)) {
            mejor = { cols, rows, celdas };
        }
    }

    return mejor;
}

async function convertirImagenAUniforme(base64, destinoAncho, destinoAlto) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = destinoAncho;
            canvas.height = destinoAlto;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                resolve(base64);
                return;
            }

            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;
            const scale = Math.min(destinoAncho / srcW, destinoAlto / srcH);
            const drawW = srcW * scale;
            const drawH = srcH * scale;
            const offsetX = (destinoAncho - drawW) / 2;
            const offsetY = (destinoAlto - drawH) / 2;

            ctx.fillStyle = "rgb(249,250,251)";
            ctx.fillRect(0, 0, destinoAncho, destinoAlto);
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
}

async function dibujarEvidenciaUnaPagina(pdf, imagenes, yInicio, yFin) {
    const areaX = 14;
    const areaY = yInicio + 8;
    const areaW = 182;
    const areaH = yFin - areaY;
    const espacio = 0;

    drawSectionHeaderBar(pdf, 12, yInicio, 186, "Evidencia fotografica");

    if (!imagenes.length) {
        pdf.setFont("courier", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...PDF_COLORS.textBody);
        drawGridBox(pdf, 12, areaY, 186, areaH, 1, 1);
        pdf.text("No se agregaron imagenes de evidencia.", 16, areaY + 9);
        return;
    }

    drawGridBox(pdf, 12, areaY, 186, areaH, 1, 1);

    const { cols, rows } = obtenerLayoutImagenes(imagenes.length);
    const celdaW = (areaW - (cols - 1) * espacio) / cols;
    const celdaH = (areaH - (rows - 1) * espacio) / rows;

    for (let i = 0; i < imagenes.length; i++) {
        const fila = Math.floor(i / cols);
        const col = i % cols;
        const x = areaX + col * (celdaW + espacio);
        const y = areaY + fila * (celdaH + espacio);

        try {
            const destinoAncho = Math.max(260, Math.round(celdaW * 11));
            const destinoAlto = Math.max(180, Math.round(celdaH * 11));
            const imagenUniforme = await convertirImagenAUniforme(imagenes[i], destinoAncho, destinoAlto);

            pdf.addImage(imagenUniforme, "PNG", x, y, celdaW, celdaH);
        } catch {
            pdf.setFont("courier", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...PDF_COLORS.textBody);
            pdf.text("Imagen no compatible", x + 2, y + (celdaH / 2));
        }
    }
}

async function generarPDF() {
    const { jsPDF } = window.jspdf;
    generarPreview();

    const pdf = new jsPDF("p", "mm", "a4");
    const data = {
        snReporte: crearNumeroReporte(),
        tecnico: TECNICO_PREDETERMINADO,
        cliente: textoSeguro(cliente.value),
        telefono: textoSeguro(telefono.value),
        marca: textoSeguro(marca.value),
        tienda: TIENDA_PREDETERMINADA,
        pais: PAIS_PREDETERMINADO,
        estado: ESTADO_PREDETERMINADO,
        ciudad: textoSeguro(ciudad.value),
        modelo: textoSeguro(modelo.value),
        anio: textoSeguro(anio.value),
        placaDelantera: textoSeguro(placa_delantera.value),
        placaTrasera: textoSeguro(placa_trasera.value),
        kilometraje: textoSeguro(kilometraje.value),
        observaciones: textoSeguro(observaciones.value, "Sin observaciones registradas."),
    };

    const fechaHoraTexto = formatoFechaHoraLocal(new Date());
    const folioTexto = crearFolio();

    addHeader(pdf, fechaHoraTexto, folioTexto, data);
    addInfoBlock(pdf, 50, data);
    addUbicacionBlock(pdf, 94, data);
    addObservaciones(pdf, 122, data.observaciones);
    await dibujarEvidenciaUnaPagina(pdf, imagenesBase64, 152, 252);
    addFirmaFooter(pdf, 255);
    addPageNumber(pdf, 1);

    pdf.save(`${crearFolio()}.pdf`);
}
