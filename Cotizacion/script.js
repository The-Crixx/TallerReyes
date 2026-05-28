const ivaRate = 0.16;
const conceptosBody = document.getElementById("conceptosBody");
const previewConceptosBody = document.getElementById("previewConceptosBody");

const PDF_COLORS = {
	textTitle: [13, 47, 82],
	textDark: [27, 54, 85],
	textBody: [74, 96, 118],
	lineSoft: [214, 224, 235],
	lineStrong: [196, 211, 226],
	cellFill: [248, 251, 255],
	accent: [13, 59, 102],
};

// Storage / autosave
const FORM_STORAGE_KEY = "cotizacion-draft-v1";
let draftDirty = false;
let draftSaveTimer = null;

function formatoFechaHoraLocal(fecha = new Date()) {
	const fechaTexto = fecha.toLocaleDateString("es-MX");
	const horaTexto = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
	return `${fechaTexto} ${horaTexto}`;
}

function sincronizarTitulo(folio) {
	if (!folio) return;
	document.title = folio;
}

function programarGuardado() {
	draftDirty = true;
	if (draftSaveTimer) clearTimeout(draftSaveTimer);
	draftSaveTimer = setTimeout(guardarBorrador, 500);
}

function guardarBorrador() {
	const data = {};
	const camposLista = ["cotizacion","cliente","direccion","telefono","email","unidad","placa","vin","kilometraje","modelo","anio","fecha","vigencia","condiciones","notas"];
	camposLista.forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;
		data[id] = el.value || "";
	});

	// guardar conceptos
	const filas = Array.from(conceptosBody.querySelectorAll('tr'));
	data.conceptos = filas.map(row => {
		const qty = row.querySelector('.qty')?.value || '';
		const unitType = row.querySelector('.unit-type')?.value || '';
		const desc = row.querySelector('.desc')?.value || '';
		const price = row.querySelector('.price')?.value || '';
		return [qty, unitType, desc, price];
	});

	try {
		localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
		draftDirty = false;
	} catch {
		// no bloquear si falla
	}
}

function construirJsonCotizacion() {
	const data = {};
	const camposLista = ["cotizacion","cliente","direccion","telefono","email","unidad","placa","vin","kilometraje","modelo","anio","fecha","vigencia","condiciones","notas"];
	camposLista.forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;
		data[id] = el.value || "";
	});

	const filas = Array.from(conceptosBody.querySelectorAll('tr'));
	data.conceptos = filas.map(row => {
		const qty = row.querySelector('.qty')?.value || '';
		const unitType = row.querySelector('.unit-type')?.value || '';
		const desc = row.querySelector('.desc')?.value || '';
		const price = row.querySelector('.price')?.value || '';
		return [qty, unitType, desc, price];
	});

	return data;
}

function descargarJson(nombreBase, data) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${safeFileName(nombreBase)}.json`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function cargarJsonCotizacion(data) {
	Object.entries(data || {}).forEach(([k, v]) => {
		if (k === 'conceptos') return;
		const el = document.getElementById(k);
		if (el) el.value = v;
	});

	if (Array.isArray(data?.conceptos)) {
		conceptosBody.innerHTML = '';
		data.conceptos.forEach(c => agregarConcepto(c));
	}

	refrescarVista();
	programarGuardado();
}

function restaurarBorrador() {
	try {
		const raw = localStorage.getItem(FORM_STORAGE_KEY);
		if (!raw) return;
		const data = JSON.parse(raw);
		Object.entries(data).forEach(([k, v]) => {
			if (k === 'conceptos') return;
			const el = document.getElementById(k);
			if (el) el.value = v;
		});

		// restaurar conceptos
		if (Array.isArray(data.conceptos)) {
			conceptosBody.innerHTML = '';
			data.conceptos.forEach(c => agregarConcepto(c));
		}
	} catch {
		// ignorar
	}
}

function configurarAutoGuardado() {
	const camposIds = ["cotizacion","cliente","direccion","telefono","email","unidad","placa","vin","kilometraje","modelo","anio","fecha","vigencia","condiciones","notas"];
	camposIds.forEach(id => {
		const el = document.getElementById(id);
		if (!el) return;
		el.addEventListener('input', () => { programarGuardado(); generarFolio(); refrescarVista(); });
		el.addEventListener('change', () => { programarGuardado(); generarFolio(); refrescarVista(); });
	});

	// guardar al salir si hay cambios
	window.addEventListener('beforeunload', (e) => {
		if (!draftDirty) return;
		// let browser show confirmation
		e.preventDefault();
		e.returnValue = '';
	});
}

const campos = {
	cotizacion: document.getElementById("cotizacion"),
	cliente: document.getElementById("cliente"),
	direccion: document.getElementById("direccion"),
	telefono: document.getElementById("telefono"),
	email: document.getElementById("email"),
	unidad: document.getElementById("unidad"),
	placa: document.getElementById("placa"),
	vin: document.getElementById("vin"),
	kilometraje: document.getElementById("kilometraje"),
	modelo: document.getElementById("modelo"),
	anio: document.getElementById("anio"),
	fecha: document.getElementById("fecha"),
	vigencia: document.getElementById("vigencia"),
	condiciones: document.getElementById("condiciones"),
	notas: document.getElementById("notas"),
};

const vistas = {
	folioPreview: document.getElementById("folioPreview"),
	vistaCliente: document.getElementById("vistaCliente"),
	vistaDireccion: document.getElementById("vistaDireccion"),
	vistaTelefono: document.getElementById("vistaTelefono"),
	vistaEmail: document.getElementById("vistaEmail"),
	vistaFolio: document.getElementById("vistaFolio"),
	vistaFecha: document.getElementById("vistaFecha"),
	vistaCondiciones: document.getElementById("vistaCondiciones"),
	vistaVigencia: document.getElementById("vistaVigencia"),
	vistaUnidad: document.getElementById("vistaUnidad"),
	vistaPlaca: document.getElementById("vistaPlaca"),
	vistaVin: document.getElementById("vistaVin"),
	vistaKilometraje: document.getElementById("vistaKilometraje"),
	vistaModelo: document.getElementById("vistaModelo"),
	vistaAnio: document.getElementById("vistaAnio"),
	vistaNotas: document.getElementById("vistaNotas"),
	subtotalTexto: document.getElementById("subtotalTexto"),
	ivaTexto: document.getElementById("ivaTexto"),
	totalTexto: document.getElementById("totalTexto"),
	cantidadLetras: document.getElementById("cantidadLetras"),
};

const inputDate = campos.fecha;
if (inputDate && !inputDate.value) {
	inputDate.valueAsDate = new Date();
}

const defaultRows = [
	["1", "", "", ""],
];

function money(value) {
	return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);
}

function clean(value, fallback = "-") {
	const text = String(value ?? "").trim();
	return text || fallback;
}

function parseNumber(value) {
	const normalized = String(value ?? "0").replace(/,/g, "").trim();
	const number = Number(normalized);
	return Number.isFinite(number) ? number : 0;
}

function formatDate(value) {
	if (!value) return "-";
	const date = new Date(`${value}T00:00:00`);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("es-MX", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

function getInitials(name) {
	if (!name) return 'CLT';
	const parts = String(name).trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return 'CLT';
	return parts.slice(0, 3).map(p => p[0].toUpperCase()).join('');
}

function abbrevModel(model) {
	if (!model) return 'MDL';
	const cleaned = String(model).toUpperCase().replace(/[^A-Z0-9]/g, '');
	return (cleaned || 'MDL').slice(0, 4);
}

function generarFolio() {
	try {
		const cliente = campos.cliente?.value || '';
		const modelo = campos.modelo?.value || campos.unidad?.value || '';
		const anioVal = (campos.anio?.value || '').replace(/[^0-9]/g, '').slice(0,4) || (campos.fecha?.value ? (new Date(campos.fecha.value+'T00:00:00')).getFullYear() : 'XXXX');
		const initials = getInitials(cliente);
		const modelAbbr = abbrevModel(modelo);
		const fechaPart = (() => {
			const d = campos.fecha?.value ? new Date(campos.fecha.value+'T00:00:00') : new Date();
			const y = d.getFullYear();
			const m = String(d.getMonth()+1).padStart(2,'0');
			const day = String(d.getDate()).padStart(2,'0');
			return `${y}${m}${day}`;
		})();
		const folio = `COT-${initials}-${modelAbbr}-${anioVal}-${fechaPart}`;
		if (campos.cotizacion) campos.cotizacion.value = folio;
		if (vistas && vistas.vistaFolio) vistas.vistaFolio.textContent = folio;
		if (vistas && vistas.folioPreview) vistas.folioPreview.textContent = folio;
		sincronizarTitulo(folio);
	} catch (e) { /* no bloquear */ }
}

function numeroALetras(numero) {
	const entero = Math.floor(Math.abs(numero));
	const centavos = Math.round((Math.abs(numero) - entero) * 100);

	const unidades = [
		"cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
		"diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve"
	];

	const decenas = {
		20: "veinte",
		30: "treinta",
		40: "cuarenta",
		50: "cincuenta",
		60: "sesenta",
		70: "setenta",
		80: "ochenta",
		90: "noventa",
	};

	const centenas = {
		100: "cien",
		200: "doscientos",
		300: "trescientos",
		400: "cuatrocientos",
		500: "quinientos",
		600: "seiscientos",
		700: "setecientos",
		800: "ochocientos",
		900: "novecientos",
	};

	function convertirBloque(n) {
		if (n < 20) return unidades[n];
		if (n < 30) return n === 20 ? "veinte" : `veinti${unidades[n - 20]}`;
		if (n < 100) {
			const d = Math.floor(n / 10) * 10;
			const u = n % 10;
			return u ? `${decenas[d]} y ${unidades[u]}` : decenas[d];
		}
		if (n < 1000) {
			if (n === 100) return centenas[100];
			const c = Math.floor(n / 100) * 100;
			const resto = n % 100;
			const prefijo = c === 100 ? "ciento" : centenas[c];
			return resto ? `${prefijo} ${convertirBloque(resto)}` : prefijo;
		}
		if (n < 1000000) {
			const miles = Math.floor(n / 1000);
			const resto = n % 1000;
			const milesTexto = miles === 1 ? "mil" : `${convertirBloque(miles)} mil`;
			return resto ? `${milesTexto} ${convertirBloque(resto)}` : milesTexto;
		}
		if (n < 1000000000) {
			const millones = Math.floor(n / 1000000);
			const resto = n % 1000000;
			const millonesTexto = millones === 1 ? "un millon" : `${convertirBloque(millones)} millones`;
			return resto ? `${millonesTexto} ${convertirBloque(resto)}` : millonesTexto;
		}
		return String(n);
	}

	const textoEntero = entero === 0 ? "cero" : convertirBloque(entero);
	return `${textoEntero.toUpperCase()} PESOS ${String(centavos).padStart(2, "0")}/100 M.N.`;
}

function crearFila(data = []) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
		<td class="center" data-label="Cantidad"><input type="number" min="0" step="1" value="${data[0] ?? 1}" class="qty"></td>
		<td class="center">
			<select class="unit-type" data-label="Unidad">
				<option value="">Selecciona una opcion</option>
				<option value="Unidad">Unidad</option>
				<option value="Servicio">Servicio</option>
				<option value="Pieza">Pieza</option>
				<option value="Juego">Juego</option>
			</select>
		</td>
		<td data-label="Descripcion"><input type="text" value="${data[2] ?? ""}" class="desc"></td>
		<td data-label="Precio unitario"><input type="number" min="0" step="0.01" value="${data[3] ?? ""}" class="price right"></td>
		<td class="center" data-label="Importe"><strong class="line-total">$0.00</strong></td>
		<td class="center" data-label="Accion">
			<div class="row-actions">
				<button type="button" class="small-btn btn-inline red remove-row">Quitar</button>
			</div>
		</td>
	`;
	tr.querySelector(".unit-type").value = data[1] ?? "";
	return tr;
}

function crearFilaPreview(data = []) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
		<td class="center" data-label="Cantidad"><span class="preview-value qty-preview">${data[0] ?? ""}</span></td>
		<td class="center" data-label="Unidad"><span class="preview-value unit-type-preview">${data[1] ?? ""}</span></td>
		<td data-label="Descripcion"><span class="preview-value desc-preview">${data[2] ?? ""}</span></td>
		<td data-label="Precio unitario"><span class="preview-value price-preview">${money(data[3] ?? 0)}</span></td>
		<td class="center" data-label="Importe"><strong class="line-total-preview">$0.00</strong></td>
	</tr>
	`;
	return tr;
}

function rowElements(row) {
	return {
		qty: row.querySelector(".qty"),
		unitType: row.querySelector(".unit-type"),
		desc: row.querySelector(".desc"),
		price: row.querySelector(".price"),
		total: row.querySelector(".line-total"),
	};
}

function recalcular() {
	const rows = Array.from(conceptosBody.querySelectorAll("tr"));
	let subtotal = 0;

	rows.forEach((row) => {
		const refs = rowElements(row);
		const qty = parseNumber(refs.qty.value) || 0;
		const price = parseNumber(refs.price.value) || 0;
		const importe = Math.max(0, qty * price);

		subtotal += importe;
		refs.total.textContent = money(importe);
	});

	const iva = subtotal * ivaRate;
	const total = subtotal + iva;

	vistas.subtotalTexto.textContent = money(subtotal);
	vistas.ivaTexto.textContent = money(iva);
	vistas.totalTexto.textContent = money(total);
	vistas.cantidadLetras.textContent = numeroALetras(total);
}

function refrescarVistaPreviaConceptos() {
	previewConceptosBody.innerHTML = "";

	const rows = Array.from(conceptosBody.querySelectorAll("tr"));
	rows.forEach((row) => {
		const refs = rowElements(row);
		const data = [
			refs.qty.value,
			refs.unitType.value,
			refs.desc.value,
			refs.price.value,
		];
		const previewRow = crearFilaPreview(data);
		const total = Math.max(0, parseNumber(refs.qty.value) * parseNumber(refs.price.value));
		previewRow.querySelector(".line-total-preview").textContent = money(total);
		previewConceptosBody.appendChild(previewRow);
	});

	if (!rows.length) {
		const tr = document.createElement("tr");
		tr.innerHTML = '<td colspan="5" class="center" data-label="Conceptos">Sin conceptos capturados</td>';
		previewConceptosBody.appendChild(tr);
	}
}

function refrescarVista() {
	const folio = clean(campos.cotizacion.value, "COT-2026-001");
	vistas.folioPreview.textContent = folio;
	vistas.vistaFolio.textContent = folio;
	vistas.vistaCliente.textContent = clean(campos.cliente.value);
	vistas.vistaDireccion.textContent = clean(campos.direccion.value);
	vistas.vistaTelefono.textContent = clean(campos.telefono.value);
	vistas.vistaEmail.textContent = clean(campos.email.value);
	vistas.vistaFecha.textContent = formatDate(campos.fecha.value);
	vistas.vistaCondiciones.textContent = clean(campos.condiciones.value);
	vistas.vistaVigencia.textContent = clean(campos.vigencia.value);
	const unidad = clean(campos.unidad.value);
	const modelo = clean(campos.modelo.value);
	const anio = clean(campos.anio.value);
	vistas.vistaUnidad.textContent = [unidad, modelo, anio].filter(Boolean).join(" ") || "-";
	vistas.vistaPlaca.textContent = clean(campos.placa.value);
	vistas.vistaVin.textContent = clean(campos.vin.value);
	vistas.vistaKilometraje.textContent = clean(campos.kilometraje.value);
	if (vistas.vistaModelo) vistas.vistaModelo.textContent = modelo || "-";
	if (vistas.vistaAnio) vistas.vistaAnio.textContent = anio || "-";
	vistas.vistaNotas.textContent = clean(campos.notas.value, "Sin observaciones registradas.");
	recalcular();
	refrescarVistaPreviaConceptos();
}

function agregarConcepto(data = []) {
	conceptosBody.appendChild(crearFila(data));
	const row = conceptosBody.lastElementChild;

	row.querySelectorAll("input, select").forEach((control) => {
		control.addEventListener("input", () => { refrescarVista(); programarGuardado(); });
		control.addEventListener("change", () => { refrescarVista(); programarGuardado(); });
	});

	row.querySelector(".remove-row").addEventListener("click", () => {
		if (conceptosBody.children.length <= 1) return;
		row.remove();
		refrescarVista();
		programarGuardado();
	});

	refrescarVista();
}

function limpiarTodo() {
	if (!confirm("Se borraran los datos de la cotizacion. Deseas continuar?")) return;

	Object.values(campos).forEach((campo) => {
		if (campo.id === "condiciones") {
			campo.value = "";
		} else if (campo.id === "vigencia") {
			campo.value = "30 dias";
		} else if (campo.id === "fecha") {
			campo.valueAsDate = new Date();
		} else {
			campo.value = "";
		}
	});

	conceptosBody.innerHTML = "";
	defaultRows.forEach((row) => agregarConcepto(row));
	try { localStorage.removeItem(FORM_STORAGE_KEY); } catch {}
	draftDirty = false;
	refrescarVista();
}

function obtenerDatosPDF() {
	const filas = Array.from(conceptosBody.querySelectorAll("tr")).map((row) => {
		const refs = rowElements(row);
		const qty = parseNumber(refs.qty?.value);
		const unit = clean(refs.unitType?.value, "-");
		const desc = clean(refs.desc?.value, "Sin descripcion");
		const price = parseNumber(refs.price?.value);
		return {
			qty,
			unit,
			desc,
			price,
			importe: Math.max(0, qty * price),
		};
	});

	const subtotal = filas.reduce((sum, row) => sum + row.importe, 0);
	const iva = subtotal * ivaRate;
	const total = subtotal + iva;

	return {
		folio: clean(campos.cotizacion?.value, "COTIZACION"),
		cliente: clean(campos.cliente?.value),
		direccion: clean(campos.direccion?.value),
		telefono: clean(campos.telefono?.value),
		email: clean(campos.email?.value),
		unidad: clean(campos.unidad?.value),
		modelo: clean(campos.modelo?.value),
		anio: clean(campos.anio?.value),
		placa: clean(campos.placa?.value),
		vin: clean(campos.vin?.value),
		kilometraje: clean(campos.kilometraje?.value),
		fecha: formatDate(campos.fecha?.value),
		condiciones: clean(campos.condiciones?.value),
		vigencia: clean(campos.vigencia?.value),
		notas: clean(campos.notas?.value, "Sin observaciones registradas."),
		fechaHora: formatoFechaHoraLocal(new Date()),
		conceptos: filas.length ? filas : [{ qty: 1, unit: "-", desc: "Sin conceptos capturados", price: 0, importe: 0 }],
		subtotal,
		iva,
		total,
	};
}

function safeFileName(value) {
	return String(value || "cotizacion")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\\/:*?"<>|]+/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "")
		.toUpperCase();
}

function formatClientName(value) {
	const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return "Cliente";
	const first = parts[0];
	const initials = parts.slice(1).map(p => p.charAt(0).toUpperCase()).join("");
	return `${first}${initials}`;
}

function buildReportNameCotizacion(data) {
	const modelo = safeFileName(data?.modelo || data?.unidad || "Modelo");
	const placa = safeFileName(data?.placa || "Placa");
	const cliente = safeFileName(formatClientName(data?.cliente || "Cliente"));
	const fechaRaw = campos.fecha?.value || "";
	const fecha = fechaRaw ? fechaRaw.replace(/-/g, "") : new Date().toISOString().slice(0, 10).replace(/-/g, "");
	return `COT_${modelo}_${placa}_${cliente}_${fecha}`;
}

function toDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = () => reject(new Error("No se pudo convertir el logo a imagen"));
		reader.readAsDataURL(blob);
	});
}

let logoPdfPromise = null;

async function obtenerLogoPdf() {
	if (!logoPdfPromise) {
		logoPdfPromise = (async () => {
			const resp = await fetch("logo.png");
			if (!resp.ok) throw new Error("No se pudo cargar logo.png");
			const blob = await resp.blob();
			const dataUrl = await toDataUrl(blob);
			// create Image to get intrinsic size
			const img = await new Promise((resolve, reject) => {
				const i = new Image();
				i.onload = () => resolve(i);
				i.onerror = () => reject(new Error('No se pudo cargar la imagen del logo')); 
				i.src = dataUrl;
			});
			return { dataUrl, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
		})().catch((error) => { logoPdfPromise = null; throw error; });
	}
	return logoPdfPromise;
}

function drawPdfHeader(pdf, data, margin, pageWidth, logoInfo, isFirstPage = true) {
	// solo mostrar encabezado en la primera página
	if (!isFirstPage) {
		return margin;
	}
	const logoTop = Math.max(10, margin + 2);
	pdf.setTextColor(...PDF_COLORS.textBody);
	let drawH = 0;
	if (logoInfo && logoInfo.dataUrl) {
		// preserve aspect ratio: fit within maxW x maxH
		// logo only on first page, compact size
		const maxW = 50; const maxH = 14;
		const iw = logoInfo.width || maxW;
		const ih = logoInfo.height || maxH;
		const scale = Math.min(maxW / iw, maxH / ih, 1);
		const drawW = iw * scale;
		drawH = ih * scale;
		const x = (pageWidth - drawW) / 2;
		pdf.addImage(logoInfo.dataUrl, "PNG", x, logoTop, drawW, drawH);
	}
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	const separatorY = logoTop + Math.max(drawH + 4, 20);
	pdf.line(margin, separatorY, pageWidth - margin, separatorY);
	return separatorY + 3;
}

function drawInfoGrid(pdf, data, x, y, width) {
	const gap = 4;
	const leftW = (width - gap) * 0.58;
	const rightW = width - gap - leftW;
	const boxH = 26;

	function drawShadowedBox(boxX, boxY, boxW, boxH) {
		pdf.setFillColor(236, 240, 244);
		pdf.rect(boxX + 1, boxY + 1, boxW, boxH, "F");
		pdf.setFillColor(255, 255, 255);
		pdf.setDrawColor(...PDF_COLORS.lineSoft);
		pdf.rect(boxX, boxY, boxW, boxH, "S");
	}

	function drawBox(boxX, boxY, boxW, title, lines) {
		drawShadowedBox(boxX, boxY, boxW, boxH);
		pdf.setFont("helvetica", "bold");
		pdf.setTextColor(...PDF_COLORS.textTitle);
		pdf.setFontSize(8.9);
		pdf.text(title.toUpperCase(), boxX + 3, boxY + 4.8);
		pdf.setFont("helvetica", "normal");
		pdf.setTextColor(...PDF_COLORS.textBody);
		pdf.setFontSize(8.2);
		let lineY = boxY + 9.3;
		lines.forEach((line) => {
			const pieces = pdf.splitTextToSize(line, boxW - 6);
			pieces.forEach((piece) => {
				pdf.text(piece, boxX + 3, lineY);
				lineY += 3.95;
			});
		});
	}

	drawBox(x, y, leftW, "A quien corresponda", [
		`Nombre: ${data.cliente}`,
		`Direccion: ${data.direccion}`,
		`Telefono: ${data.telefono}`,
		`Correo: ${data.email}`,
	]);
	drawBox(x + leftW + gap, y, rightW, "Adicional", [
		`Folio: ${data.folio}`,
		`Fecha: ${data.fecha}`,
		`Condiciones: ${data.condiciones || "-"}`,
		`Vigencia: ${data.vigencia}`,
	]);

	return y + boxH + 3;
}

function drawConceptSummary(pdf, data, x, y, width) {
	const lines = [
		[`UNIDAD:`, [data.unidad, data.modelo, data.anio].filter(Boolean).join(" ") || "-"],
		[`PLACAS:`, data.placa],
		[`VIN:`, data.vin],
		[`KILOMETRAJE:`, data.kilometraje || "-"],
		[`MODELO:`, data.modelo || "-"],
		[`AÑO:`, data.anio || "-"],
	];
	const boxH = Math.max(23, 7 + (lines.length * 4.2));
	pdf.setFillColor(236, 240, 244);
	pdf.rect(x + 1, y + 1, width, boxH, "F");
	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.rect(x, y, width, boxH, "S");
	pdf.setFont("helvetica", "bold");
	pdf.setTextColor(...PDF_COLORS.textTitle);
	pdf.setFontSize(8.3);
	const labelWidths = lines.map(([label]) => pdf.getTextWidth(label));
	const maxLabelW = Math.min(Math.max(...labelWidths, 0), width * 0.45);
	let lineY = y + 5.1;
	lines.forEach(([label, value]) => {
		pdf.text(label, x + 2.5, lineY);
		pdf.setFont("helvetica", "normal");
		pdf.setTextColor(...PDF_COLORS.textDark);
		const valueX = x + 2.5 + maxLabelW + 2;
		pdf.text(String(value || "-"), valueX, lineY);
		pdf.setFont("helvetica", "bold");
		pdf.setTextColor(...PDF_COLORS.textTitle);
		lineY += 4.2;
	});
	return y + boxH + 3;
}

function drawTableHeader(pdf, x, y, widths) {
	const headerH = 8;
	pdf.setFillColor(...PDF_COLORS.cellFill);
	pdf.setDrawColor(...PDF_COLORS.lineStrong);
	pdf.rect(x, y, widths.reduce((sum, w) => sum + w, 0), headerH, "F");
	pdf.setFont("helvetica", "bold");
	pdf.setFontSize(8.3);
	pdf.setTextColor(...PDF_COLORS.textTitle);
	const labels = ["Cantidad", "Unidad", "Descripcion", "Precio Unitario", "Importe"];
	let cursorX = x;
	labels.forEach((label, index) => {
		pdf.rect(cursorX, y, widths[index], headerH);
		const headerLines = pdf.splitTextToSize(label, widths[index] - 2);
		const headerText = Array.isArray(headerLines) ? headerLines : [headerLines];
		const startY = y + (headerText.length > 1 ? 3.5 : 5.2);
		pdf.text(headerText, cursorX + widths[index] / 2, startY, { align: "center" });
		cursorX += widths[index];
	});
	return y + headerH;
}

function drawConceptsContainerStart(pdf, x, y, width) {
	const headerH = 8;
	pdf.setFillColor(236, 240, 244);
	pdf.rect(x + 1, y + 1, width, headerH, "F");
	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.rect(x, y, width, headerH, "S");
	pdf.setFont("helvetica", "bold");
	pdf.setTextColor(...PDF_COLORS.textTitle);
	pdf.setFontSize(8.8);
	pdf.text("CONCEPTOS", x + 3, y + 5.2);
	return y + headerH + 3;
}

function drawConceptRow(pdf, x, y, widths, row) {
	const padding = 1.6;
	const unitLabel = (row.unit || "-").toLowerCase().includes("servicio") ? "Unidad de servicio" : (row.unit || "-");
	const descWidth = widths[2] - padding * 2;
	const descLines = pdf.splitTextToSize(row.desc || "-", descWidth);
	const unitLines = pdf.splitTextToSize(unitLabel, widths[1] - padding * 2);
	const lineCount = Math.max(Array.isArray(descLines) ? descLines.length : 1, Array.isArray(unitLines) ? unitLines.length : 1);
	const rowH = Math.max(9, 5.5 + lineCount * 4.2);
	const cells = [
		String(row.qty ?? ""),
		unitLabel,
		row.desc || "-",
		money(row.price || 0),
		money(row.importe || 0),
	];

	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.setFont("helvetica", "normal");
	pdf.setFontSize(8.0);
	let cursorX = x;
	for (let i = 0; i < widths.length; i++) {
		pdf.rect(cursorX, y, widths[i], rowH);
		if (i === 2) {
			pdf.text(descLines, cursorX + padding, y + 4.5);
		} else if (i === 1) {
			pdf.text(unitLines, cursorX + widths[i] / 2, y + 4.5, { align: "center" });
		} else if (i === 0) {
			pdf.setFont("helvetica", "bold");
			pdf.text(cells[i], cursorX + widths[i] / 2, y + rowH / 2 + 1.5, { align: "center", baseline: "middle" });
			pdf.setFont("helvetica", "normal");
		} else {
			pdf.text(cells[i], cursorX + widths[i] - 2, y + rowH / 2 + 1.5, { align: "right", baseline: "middle" });
		}
		cursorX += widths[i];
	}
	return rowH;
}

function drawFooterBlock(pdf, data, x, y, width) {
	const gap = 6;
	const rightW = 68;
	const leftW = width - rightW - gap;
	const notesH = 26;
	const totalsH = 26;
	const contentH = Math.max(notesH, totalsH);

	pdf.setFillColor(236, 240, 244);
	pdf.rect(x + 1, y + 1, leftW, contentH, "F");
	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.rect(x, y, leftW, contentH, "S");
	pdf.setFont("helvetica", "bold");
	pdf.setTextColor(...PDF_COLORS.textTitle);
	pdf.setFontSize(8.6);
	pdf.text("OBSERVACIONES", x + 3, y + 4.8);
	pdf.setFont("helvetica", "normal");
	pdf.setTextColor(...PDF_COLORS.textBody);
	pdf.setFontSize(7.9);
	const noteLines = pdf.splitTextToSize(data.notas, leftW - 6);
	pdf.text(noteLines, x + 3, y + 9.2);

	pdf.setFillColor(236, 240, 244);
	pdf.rect(x + leftW + gap + 1, y + 1, rightW, contentH, "F");
	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.rect(x + leftW + gap, y, rightW, contentH, "S");
	pdf.setFont("helvetica", "bold");
	pdf.setTextColor(...PDF_COLORS.textTitle);
	pdf.setFontSize(8.6);
	pdf.text("TOTALES", x + leftW + gap + 3, y + 4.8);
	pdf.setFont("helvetica", "normal");
	pdf.setTextColor(...PDF_COLORS.textDark);
	pdf.setFontSize(7.9);
	const tx = x + leftW + gap + 3;
	const lineY = y + 10;
	pdf.text(`Subtotal: ${money(data.subtotal)}`, tx, lineY);
	pdf.text(`IVA: ${money(data.iva)}`, tx, lineY + 5);
	pdf.setFont("helvetica", "bold");
	pdf.text(`Total: ${money(data.total)}`, tx, lineY + 10);

	return y + contentH + 8;
}

function drawBottomLine(pdf, data, x, y, width) {
	pdf.setFillColor(236, 240, 244);
	pdf.rect(x + 1, y + 1, width, 12, "F");
	pdf.setFillColor(255, 255, 255);
	pdf.setDrawColor(...PDF_COLORS.lineSoft);
	pdf.rect(x, y, width, 12, "S");
	pdf.setFont("helvetica", "bold");
	pdf.setTextColor(...PDF_COLORS.textTitle);
	pdf.setFontSize(8.4);
	pdf.text(`CANTIDAD CON LETRA`, x + width / 2, y + 4.1, { align: "center" });
	pdf.setFont("helvetica", "normal");
	pdf.setTextColor(...PDF_COLORS.textDark);
	pdf.setFontSize(8.6);
	const text = numeroALetras(data.total);
	pdf.text(pdf.splitTextToSize(text, width - 10), x + width / 2, y + 9.2, { align: "center" });
	return y + 18;
}

async function generarPDF() {
	try {
		if (typeof window.jspdf === "undefined") {
			alert("La libreria jsPDF no esta cargada.");
			return;
		}

		refrescarVista();
		generarFolio();
		const data = obtenerDatosPDF();
		const nombreBase = buildReportNameCotizacion(data);
		const folioArchivo = `${nombreBase}.pdf`;
		const { jsPDF } = window.jspdf;
		const pdf = new jsPDF("p", "mm", "a4");
		const pageW = pdf.internal.pageSize.getWidth();
		const pageH = pdf.internal.pageSize.getHeight();
		const margin = 10;
		const contentW = pageW - margin * 2;
		const tableWidths = [16, 22, 80, 28, 44];
		const footerReserve = 48;
		const logoInfo = await obtenerLogoPdf().catch(() => null);

		let y = drawPdfHeader(pdf, data, margin, pageW, logoInfo, true);
		y = drawInfoGrid(pdf, data, margin, y, contentW);
		y = drawConceptSummary(pdf, data, margin, y, contentW);
		y = drawConceptsContainerStart(pdf, margin, y, contentW);
		y = drawTableHeader(pdf, margin, y, tableWidths);
		y += 1;

		for (const row of data.conceptos) {
			const rowHeight = Math.max(8, 5 + Math.max((pdf.splitTextToSize(row.desc || "-", tableWidths[2] - 3) || []).length, 1) * 3.8);
			if (y + rowHeight > pageH - margin - footerReserve) {
				pdf.addPage();
				y = margin + 3;
				y = drawPdfHeader(pdf, data, margin, pageW, logoInfo, false);
				y = drawConceptsContainerStart(pdf, margin, y, contentW);
				y = drawTableHeader(pdf, margin, y, tableWidths);
				y += 1;
			}
			y += drawConceptRow(pdf, margin, y, tableWidths, row);
		}

		if (y + 30 > pageH - margin) {
			pdf.addPage();
			y = margin + 4;
		}
		y += 4;
		y = drawFooterBlock(pdf, data, margin, y, contentW);
		y = drawBottomLine(pdf, data, margin, y, contentW);

		const footerY = pageH - margin - 4;
		pdf.setFont("helvetica", "italic");
		pdf.setFontSize(7.2);
		pdf.setTextColor(...PDF_COLORS.textBody);
		pdf.text("Cotizacion generada para revision y autorizacion. Los precios pueden cambiar sin previo aviso.", pageW / 2, footerY, { align: "center" });

		pdf.save(folioArchivo);
		descargarJson(`${nombreBase}_editable`, construirJsonCotizacion());
	} catch (e) {
		console.error(e);
		alert("Error al generar PDF: " + (e && e.message ? e.message : e));
	}
}

document.getElementById("btnAgregar").addEventListener("click", () => agregarConcepto());
document.getElementById("btnLimpiar").addEventListener("click", limpiarTodo);
const btnGen = document.getElementById("btnGenerarPDF");
if (btnGen) btnGen.addEventListener("click", generarPDF);

const btnEditar = document.getElementById("btnEditar");
const inputJson = document.getElementById("inputJson");
if (btnEditar && inputJson) {
	btnEditar.addEventListener("click", () => inputJson.click());
	inputJson.addEventListener("change", async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			cargarJsonCotizacion(data);
		} catch (e) {
			alert("No se pudo leer el JSON: " + (e && e.message ? e.message : e));
		} finally {
			inputJson.value = "";
		}
	});
}

Object.values(campos).forEach((campo) => {
	campo.addEventListener("input", () => { refrescarVista(); programarGuardado(); });
	campo.addEventListener("change", () => { refrescarVista(); programarGuardado(); });
});


// inicializacion: restaurar borrador si existe
restaurarBorrador();

if (!conceptosBody.children.length) {
	defaultRows.forEach((row) => agregarConcepto(row));
}

// generar folio autmatico
generarFolio();

// fecha y hora automaticas en preview
const ahora = new Date();
document.getElementById('fechaHoraPreview').textContent = formatoFechaHoraLocal(ahora);

configurarAutoGuardado();
refrescarVista();
