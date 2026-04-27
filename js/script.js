const NOMBRE_TALLER = "SERVICIOS REYES";
const TECNICO_PREDETERMINADO = "Carlos Reyes";
const TIENDA_PREDETERMINADA = "Servicios Reyes";
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
    textTitle: [13, 47, 82],
    textDark: [27, 54, 85],
    textBody: [74, 96, 118],
    lineSoft: [214, 224, 235],
    lineStrong: [196, 211, 226],
    cellFill: [248, 251, 255],
    accent: [13, 59, 102],
};

const PDF_FONT_NAMES = {
    body: "SourceSans3",
    title: "LibreBaskerville",
};

const PDF_FONT_SOURCES = {
    SourceSans3: {
        normal: {
            url: "https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.ttf",
            file: "SourceSans3-Regular.ttf",
        },
        bold: {
            url: "https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.ttf",
            file: "SourceSans3-Bold.ttf",
        },
    },
    LibreBaskerville: {
        bold: {
            url: "https://cdn.jsdelivr.net/npm/@fontsource/libre-baskerville/files/libre-baskerville-latin-700-normal.ttf",
            file: "LibreBaskerville-Bold.ttf",
        },
    },
};

const pdfFontCache = new Map();

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function cargarFuentePdf(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("No se pudo cargar fuente PDF");
    const buffer = await resp.arrayBuffer();
    return arrayBufferToBase64(buffer);
}

async function registrarFuentesPdf(pdf) {
    const tareas = [];

    Object.entries(PDF_FONT_SOURCES).forEach(([familia, estilos]) => {
        Object.entries(estilos).forEach(([estilo, data]) => {
            tareas.push({ familia, estilo, ...data });
        });
    });

    for (const fuente of tareas) {
        if (!pdfFontCache.has(fuente.file)) {
            try {
                const base64 = await cargarFuentePdf(fuente.url);
                pdfFontCache.set(fuente.file, base64);
            } catch {
                continue;
            }
        }

        const base64 = pdfFontCache.get(fuente.file);
        if (!base64) continue;
        pdf.addFileToVFS(fuente.file, base64);
        pdf.addFont(fuente.file, fuente.familia, fuente.estilo);
    }
}

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
    pdf.setFont(PDF_FONT_NAMES.body, "bold");
    pdf.setTextColor(...PDF_COLORS.textTitle);
    pdf.setFontSize(9.6);
    pdf.text(texto, x + 2, y + 6);
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

function drawSectionCard(pdf, x, y, w, h) {
    pdf.setFillColor(...PDF_COLORS.cellFill);
    pdf.setDrawColor(...PDF_COLORS.lineSoft);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(x, y, w, h, 3.5, 3.5, "FD");
}

function addHeader(pdf, fechaHoraTexto, folioTexto, data) {
    const margin = 12;
    const logoBoxW = 76;
    const logoBoxH = 24;
    const ratio = Math.max(0.5, Math.min(8, logoAspectRatio || 3));

    let logoW = logoBoxW;
    let logoH = logoW / ratio;
    if (logoH > logoBoxH) {
        logoH = logoBoxH;
        logoW = logoH * ratio;
    }

    const headerTop = 9;
    const logoX = margin;
    const logoY = headerTop + ((logoBoxH - logoH) / 2);
    const middleX = margin + 82;
    const rightX = margin + 186;

    // Usa el mismo logo cargado para la vista previa.
    try {
        pdf.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
    } catch {
        // Si falla el recurso, omite logo sin romper el PDF.
    }

    pdf.setFont(PDF_FONT_NAMES.body, "bold");
    pdf.setTextColor(...PDF_COLORS.textTitle);
    pdf.setFontSize(11.4);
    pdf.text(NOMBRE_TALLER, middleX, headerTop + 7.2);

    pdf.setFont(PDF_FONT_NAMES.body, "normal");
    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFontSize(8.4);
    pdf.text("Reporte de recepcion de vehiculo", middleX, headerTop + 12.6);

    const etiquetaFecha = "Fecha y hora:";
    const etiquetaFolio = "Folio:";

    pdf.setFontSize(8.0);

    pdf.setFont(PDF_FONT_NAMES.body, "bold");
    pdf.setTextColor(...PDF_COLORS.textDark);
    const fechaLabelW = pdf.getTextWidth(etiquetaFecha + " ");
    const folioLabelW = pdf.getTextWidth(etiquetaFolio + " ");

    pdf.setFont(PDF_FONT_NAMES.body, "normal");
    pdf.setTextColor(...PDF_COLORS.textBody);
    const fechaValueW = pdf.getTextWidth(fechaHoraTexto);
    const folioValueW = pdf.getTextWidth(folioTexto);

    const fechaLineX = rightX - (fechaLabelW + fechaValueW);
    const folioLineX = rightX - (folioLabelW + folioValueW);

    pdf.setFont(PDF_FONT_NAMES.body, "bold");
    pdf.setTextColor(...PDF_COLORS.textDark);
    pdf.text(etiquetaFecha, fechaLineX, headerTop + 8.2);
    pdf.text(etiquetaFolio, folioLineX, headerTop + 14.0);

    pdf.setFont(PDF_FONT_NAMES.body, "normal");
    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.text(fechaHoraTexto, fechaLineX + fechaLabelW, headerTop + 8.2);
    pdf.text(folioTexto, folioLineX + folioLabelW, headerTop + 14.0);

    pdf.setDrawColor(...PDF_COLORS.lineStrong);
    pdf.setLineWidth(0.7);
    pdf.line(margin, headerTop + 21.6, margin + 186, headerTop + 21.6);
}

function addInfoBlock(pdf, y, data) {
    const x = 12;
    const w = 186;
    const cardY = y + 10;
    const cardH = 68;
    const paddingX = 8;
    const paddingTop = 12;
    const gap = 10;

    drawSectionHeaderBar(pdf, x, y, w, "Datos del cliente y unidad");
    drawSectionCard(pdf, x, cardY, w, cardH);

    const colW = (w - (paddingX * 2) - gap) / 2;
    const leftX = x + paddingX;
    const rightX = leftX + colW + gap;
    const rowH = 6.6;

    const filas = [
        ["Cliente", data.cliente, "Telefono", data.telefono],
        ["Marca", data.marca, "Modelo", data.modelo],
        ["Año", data.anio, "Placa delantera", data.placaDelantera],
        ["Placa trasera", data.placaTrasera, "Kilometraje", data.kilometraje],
        ["SN / Reporte", data.snReporte, "Tecnico", data.tecnico],
        ["Tienda", data.tienda, "Pais", data.pais],
        ["Estado", data.estado, "Ciudad", data.ciudad],
    ];

    const drawLabelValue = (xPos, yPos, label, valor) => {
        const etiqueta = `${label}:`;
        pdf.setFont(PDF_FONT_NAMES.body, "bold");
        pdf.setTextColor(...PDF_COLORS.textDark);
        pdf.setFontSize(8.6);
        pdf.text(etiqueta, xPos, yPos);

        const labelW = pdf.getTextWidth(etiqueta) + 1.5;
        const valueW = Math.max(10, colW - labelW - 2);

        pdf.setFont(PDF_FONT_NAMES.body, "normal");
        pdf.setTextColor(...PDF_COLORS.textBody);
        pdf.text(textoEnUnaLinea(pdf, valor, valueW), xPos + labelW, yPos);
    };

    filas.forEach((fila, index) => {
        const yy = cardY + paddingTop + (index * rowH);
        drawLabelValue(leftX, yy, fila[0], fila[1]);
        drawLabelValue(rightX, yy, fila[2], fila[3]);
    });
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

        pdf.setFont(PDF_FONT_NAMES.body, "bold");
        pdf.setTextColor(...PDF_COLORS.textDark);
        pdf.setFontSize(8.7);
        pdf.text(etiqueta, left + 2, yy);

        const labelW = pdf.getTextWidth(etiqueta) + 2;
        const valueW = Math.max(10, colW - labelW - 6);

        pdf.setFont(PDF_FONT_NAMES.body, "normal");
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
    const cardY = y + 10;
    const cardH = 30;

    drawSectionHeaderBar(pdf, x, y, w, "Observaciones de recepcion");
    drawSectionCard(pdf, x, cardY, w, cardH);

    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFont(PDF_FONT_NAMES.body, "normal");
    pdf.setFontSize(8.6);
    const lineas = pdf.splitTextToSize(texto, 176);
    pdf.text(lineas, x + 6, cardY + 9.5);
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
    pdf.setFont(PDF_FONT_NAMES.body, "bold");
    pdf.setFontSize(9);
    pdf.text("Firma del responsable de recepcion", centerX, y + 21, { align: "center" });
}

function addPageNumber(pdf, numeroPagina) {
    pdf.setTextColor(...PDF_COLORS.textBody);
    pdf.setFont(PDF_FONT_NAMES.body, "normal");
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

function obtenerColumnasEvidencia(total) {
    if (total <= 1) return 1;
    if (total <= 4) return 2;
    if (total <= 9) return 3;
    return 4;
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
        pdf.setFont(PDF_FONT_NAMES.body, "normal");
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
            pdf.setFont(PDF_FONT_NAMES.body, "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...PDF_COLORS.textBody);
            pdf.text("Imagen no compatible", x + 2, y + (celdaH / 2));
        }
    }
}

function addObservacionesPaginadas(pdf, yInicial, texto, paginaInicial) {
    const x = 12;
    const w = 186;
    const lineHeight = 4.4;
    const lineas = pdf.splitTextToSize(texto || "", 180);
    let indice = 0;
    let y = yInicial;
    let pagina = paginaInicial;

    while (indice < lineas.length || (lineas.length === 0 && indice === 0)) {
        const titulo = pagina === paginaInicial
            ? "Observaciones de recepcion"
            : "Observaciones de recepcion (continuacion)";

        drawSectionHeaderBar(pdf, x, y, w, titulo);

        const cardY = y + 10;
        const bottom = 272;
        const cardH = Math.max(30, bottom - cardY);
        drawSectionCard(pdf, x, cardY, w, cardH);

        const maxLineas = Math.max(1, Math.floor((cardH - 12) / lineHeight));
        const chunk = lineas.length ? lineas.slice(indice, indice + maxLineas) : ["Sin observaciones registradas."];

        pdf.setTextColor(...PDF_COLORS.textBody);
        pdf.setFont(PDF_FONT_NAMES.body, "normal");
        pdf.setFontSize(8.6);
        pdf.text(chunk, x + 6, cardY + 9.5);

        indice += lineas.length ? chunk.length : 1;

        if (indice < lineas.length) {
            addPageNumber(pdf, pagina);
            pdf.addPage();
            pagina += 1;
            y = 14;
            continue;
        }

        return { paginaActual: pagina, siguienteY: cardY + cardH + 6 };
    }

    return { paginaActual: pagina, siguienteY: yInicial + 40 };
}

async function dibujarEvidenciaPaginada(pdf, imagenes, yInicial, paginaInicial) {
    const x = 12;
    const w = 186;
    const areaX = 14;
    const areaW = 182;
    const espacio = 2;
    const bottomConFirma = 246;
    const ratio = 16 / 10;

    let yTitulo = yInicial;
    let pagina = paginaInicial;
    let index = 0;
    const colsBase = obtenerColumnasEvidencia(imagenes.length);

    while (index < imagenes.length || (imagenes.length === 0 && index === 0)) {
        const titulo = (index === 0)
            ? "Evidencia fotografica"
            : "Evidencia fotografica (continuacion)";

        drawSectionHeaderBar(pdf, x, yTitulo, w, titulo);

        const areaY = yTitulo + 12;
        const areaH = Math.max(40, bottomConFirma - areaY);
        drawSectionCard(pdf, x, areaY, w, areaH);

        const padding = 4;
        const innerX = areaX + padding;
        const innerY = areaY + padding;
        const innerW = areaW - (padding * 2);
        const innerH = areaH - (padding * 2);

        if (!imagenes.length) {
            pdf.setFont(PDF_FONT_NAMES.body, "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(...PDF_COLORS.textBody);
            pdf.text("No se agregaron imagenes de evidencia.", innerX, innerY + 6);
            return { paginaActual: pagina };
        }

        const cols = colsBase;
        const celdaW = (innerW - (cols - 1) * espacio) / cols;
        const objetivoH = celdaW / ratio;
        const rows = Math.max(1, Math.floor((innerH + espacio) / (objetivoH + espacio)));
        const capacidad = cols * rows;
        const celdaH = Math.min(objetivoH, (innerH - (rows - 1) * espacio) / rows);

        for (let i = 0; i < capacidad && index < imagenes.length; i++, index++) {
            const fila = Math.floor(i / cols);
            const col = i % cols;
            const drawX = innerX + col * (celdaW + espacio);
            const drawY = innerY + fila * (celdaH + espacio);

            pdf.setFillColor(...PDF_COLORS.cellFill);
            pdf.setDrawColor(...PDF_COLORS.lineSoft);
            pdf.roundedRect(drawX, drawY, celdaW, celdaH, 2, 2, "FD");

            try {
                const destinoAncho = Math.max(260, Math.round(celdaW * 11));
                const destinoAlto = Math.max(180, Math.round(celdaH * 11));
                const img = await convertirImagenAUniforme(imagenes[index], destinoAncho, destinoAlto);
                pdf.addImage(img, "PNG", drawX, drawY, celdaW, celdaH);
            } catch {
                pdf.setFont(PDF_FONT_NAMES.body, "normal");
                pdf.setFontSize(7.5);
                pdf.setTextColor(...PDF_COLORS.textBody);
                pdf.text("Imagen no compatible", drawX + 2, drawY + (celdaH / 2));
            }
        }

        if (index < imagenes.length) {
            addPageNumber(pdf, pagina);
            pdf.addPage();
            pagina += 1;
            yTitulo = 14;
            continue;
        }

        return { paginaActual: pagina };
    }

    return { paginaActual: pagina };
}

async function esperarImagenesEnPreview(previewElement) {
    const imagenes = Array.from(previewElement.querySelectorAll("img"));
    const pendientes = imagenes
        .filter((img) => !img.complete)
        .map((img) => new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
        }));

    if (pendientes.length) {
        await Promise.all(pendientes);
    }
}

function ajustarCorteParaNoPartirImagen(yInicio, yFinObjetivo, rangosImagenes) {
    let yFin = yFinObjetivo;

    // Si la linea de corte cae dentro de una imagen, sube el corte al inicio de esa imagen.
    for (const rango of rangosImagenes) {
        if (rango.start < yFin && yFin < rango.end) {
            yFin = Math.max(yInicio + 1, rango.start - 2);
            break;
        }
    }

    return yFin;
}

async function exportarPreviewPaginado(previewElement, nombreArchivo) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    await esperarImagenesEnPreview(previewElement);

    const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: previewElement.scrollWidth,
        windowHeight: previewElement.scrollHeight,
    });

    const margin = 8;
    const pageW = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pageH = pdf.internal.pageSize.getHeight() - (margin * 2);
    const pxPorMm = canvas.width / pageW;
    const altoPaginaPx = Math.floor(pageH * pxPorMm);

    const previewRect = previewElement.getBoundingClientRect();
    const escalaY = canvas.height / Math.max(1, previewElement.scrollHeight);
    const rangosImagenes = Array.from(previewElement.querySelectorAll(".mini-image")).map((img) => {
        const rect = img.getBoundingClientRect();
        const start = Math.floor((rect.top - previewRect.top + previewElement.scrollTop) * escalaY);
        const end = Math.ceil((rect.bottom - previewRect.top + previewElement.scrollTop) * escalaY);
        return { start, end };
    });
    const firmaElement = previewElement.querySelector(".pdf-sign");
    const rangosProtegidos = [...rangosImagenes];

    if (firmaElement) {
        const rect = firmaElement.getBoundingClientRect();
        rangosProtegidos.push({
            start: Math.floor((rect.top - previewRect.top + previewElement.scrollTop) * escalaY),
            end: Math.ceil((rect.bottom - previewRect.top + previewElement.scrollTop) * escalaY),
        });
    }

    let yPx = 0;
    let pageIndex = 0;

    while (yPx < canvas.height) {
        const yFinObjetivo = Math.min(yPx + altoPaginaPx, canvas.height);
        let yFin = yFinObjetivo;

        if (yFinObjetivo < canvas.height && rangosProtegidos.length) {
            yFin = ajustarCorteParaNoPartirImagen(yPx, yFinObjetivo, rangosProtegidos);
        }

        const chunkPx = Math.max(1, yFin - yPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkPx;

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) break;

        ctx.drawImage(
            canvas,
            0,
            yPx,
            canvas.width,
            chunkPx,
            0,
            0,
            canvas.width,
            chunkPx
        );

        if (pageIndex > 0) {
            pdf.addPage();
        }

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.96);
        const renderH = chunkPx / pxPorMm;
        pdf.addImage(imgData, "JPEG", margin, margin, pageW, renderH);

        yPx += chunkPx;
        pageIndex += 1;
    }

    pdf.save(nombreArchivo);
}

function recolectarDatosFormulario() {
    return {
        snReporte: crearNumeroReporte(),
        cliente: textoSeguro(cliente.value),
        telefono: textoSeguro(telefono.value),
        marca: textoSeguro(marca.value),
        modelo: textoSeguro(modelo.value),
        anio: textoSeguro(anio.value),
        placaDelantera: textoSeguro(placa_delantera.value),
        placaTrasera: textoSeguro(placa_trasera.value),
        kilometraje: textoSeguro(kilometraje.value),
        tecnico: TECNICO_PREDETERMINADO,
        tienda: TIENDA_PREDETERMINADA,
        pais: textoSeguro(pais.value),
        estado: textoSeguro(estado.value),
        ciudad: textoSeguro(ciudad.value),
        observaciones: textoSeguro(observaciones.value, "Sin observaciones registradas."),
    };
}

async function generarPDFDesdeCero(nombreArchivo) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    await registrarFuentesPdf(pdf);

    const fechaHoraTexto = formatoFechaHoraLocal(new Date());
    const folioTexto = crearFolio();
    const data = recolectarDatosFormulario();

    addHeader(pdf, fechaHoraTexto, folioTexto, data);

    let y = 38;
    addInfoBlock(pdf, y, data);
    y += 78;

    const obsResultado = addObservacionesPaginadas(pdf, y, data.observaciones, 1);
    let paginaActual = obsResultado.paginaActual;
    y = obsResultado.siguienteY;

    if (y > 210) {
        pdf.addPage();
        paginaActual += 1;
        y = 14;
    }

    const evidenciaResultado = await dibujarEvidenciaPaginada(pdf, imagenesBase64, y, paginaActual);
    paginaActual = evidenciaResultado.paginaActual;

    pdf.setPage(paginaActual);
    addFirmaFooter(pdf, 252);

    const totalPages = pdf.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
        pdf.setPage(page);
        addPageNumber(pdf, page);
    }

    pdf.save(nombreArchivo);
}

async function generarPDF() {
    generarPreview();
    await generarPDFDesdeCero(`${crearFolio()}.pdf`);
}
