/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Lee los POs de eventos HCP/HCO y entrega datos filtrables para el dashboard.
 *
 * Validaciones para ejecutar obtenerDatosEventos():
 * 1) La hoja "POs HCPs/HCOs 2026" debe existir en el archivo configurado.
 * 2) La fila 1 (hoja POs HCPs/HCOs 2026) debe conservar los encabezados indicados.
 * 3) La columna L "Valor en CHF" (hoja POs HCPs/HCOs 2026) debe contener valores numéricos o vacíos.
 */

const BCAT0054 = (function() {
  const CONFIGURACION = Object.freeze({
    ID_SPREADSHEET: "1H3MjtB17RxOY3AZPHJH3LDx79AUwuOQyiZfLRYKCSOQ",
    HOJA_BASE: "POs HCPs/HCOs 2026",
    FILA_ENCABEZADOS: 1,
    PEN_POR_USD: 3.75,
    PREFIJO_LOG: "[BCAT-0054]"
  });

  function obtenerDatos_() {
    const spreadsheet = SpreadsheetApp.openById(CONFIGURACION.ID_SPREADSHEET);
    const hoja = spreadsheet.getSheetByName(CONFIGURACION.HOJA_BASE);

    if (!hoja) {
      throw new Error("No se encontró la hoja " + CONFIGURACION.HOJA_BASE + ".");
    }

    const ultimaFila = hoja.getLastRow();
    const ultimaColumna = hoja.getLastColumn();

    if (ultimaFila <= CONFIGURACION.FILA_ENCABEZADOS) {
      return crearRespuestaVacia_(spreadsheet.getUrl());
    }

    const encabezados = hoja
      .getRange(CONFIGURACION.FILA_ENCABEZADOS, 1, 1, ultimaColumna)
      .getDisplayValues()[0];

    const rango = hoja.getRange(
      CONFIGURACION.FILA_ENCABEZADOS + 1,
      1,
      ultimaFila - CONFIGURACION.FILA_ENCABEZADOS,
      ultimaColumna
    );

    // Un único getDisplayValues evita una segunda lectura remota de toda la hoja.
    const valoresVisibles = rango.getDisplayValues();
    const columnas = crearMapaColumnas_(encabezados);

    const registros = valoresVisibles.map(function(filaVisible, indice) {
      if (filaVisible.every(function(valor) {
        return !String(valor).trim();
      })) {
        return null;
      }

      return crearRegistro_(
        filaVisible,
        columnas,
        CONFIGURACION.FILA_ENCABEZADOS + indice + 1,
        spreadsheet.getUrl(),
        hoja.getSheetId()
      );
    }).filter(Boolean);

    Logger.log(CONFIGURACION.PREFIJO_LOG + " Hoja leída: " + CONFIGURACION.HOJA_BASE + ". Registros: " + registros.length + ".");

    return {
      actualizado: obtenerMesAnterior_(),
      urlBase: spreadsheet.getUrl(),
      registros: registros,
      advertencias: crearAdvertencias_(columnas),
      filtros: {
        pais: valoresUnicos_(registros, "pais"),
        tipoInteraccion: valoresUnicos_(registros, "tipoInteraccion"),
        categoria: valoresUnicos_(registros, "categoria"),
        centroCostos: valoresUnicos_(registros, "centroCostos"),
        moneda: valoresUnicos_(registros, "moneda")
      }
    };
  }

  function crearRespuestaVacia_(urlBase) {
    return {
      actualizado: obtenerMesAnterior_(),
      urlBase: urlBase,
      registros: [],
      advertencias: ["La hoja no tiene registros debajo de los encabezados."],
      filtros: { pais: [], tipoInteraccion: [], categoria: [], centroCostos: [], moneda: [] }
    };
  }

  function crearMapaColumnas_(encabezados) {
    const encabezadosNormalizados = encabezados.map(normalizar_);
    const alias = {
      pais: ["pais"], interaccion: ["n interaccion", "n° interaccion"], evento: ["nombre del evento"],
      entidad: ["hcp/hco/proveedor"], centroCostos: ["centro de costos"], detalle: ["detalle"],
      tipoInteraccion: ["tipo de interaccion"], categoria: ["categoria"], valorPO: ["valor po"],
      valorImpuestos: ["valor con impuestos"], moneda: ["moneda"], valorCHF: ["valor en chf"],
      numeroPO: ["# po"], poEnviada: ["po enviada a proveedor"], workflow: ["aprobacion workflow"]
    };
    const mapa = {};

    Object.keys(alias).forEach(function(campo) {
      mapa[campo] = -1;
      alias[campo].some(function(nombre) {
        const indice = encabezadosNormalizados.indexOf(normalizar_(nombre));
        if (indice >= 0) {
          mapa[campo] = indice;
          return true;
        }
        return false;
      });
    });

    return mapa;
  }

  function crearRegistro_(visible, columnas, numeroFila, urlBase, gid) {
    const texto = function(campo) {
      return columnas[campo] >= 0 ? String(visible[columnas[campo]] || "").trim() : "";
    };
    const monto = function(campo) {
      return columnas[campo] >= 0 ? convertirMonto_(visible[columnas[campo]]) : null;
    };

    const evento = texto("evento");
    const entidad = texto("entidad");
    const interaccion = texto("interaccion");
    const detalle = texto("detalle");
    const numeroPO = texto("numeroPO");
    const moneda = texto("moneda") || "Sin información";
    const valorImpuestos = monto("valorImpuestos");

    return {
      filaHoja: numeroFila,
      enlace: urlBase + "#gid=" + gid + "&range=A" + numeroFila,
      pais: texto("pais") || "Sin información",
      interaccion: interaccion,
      evento: evento || "Sin evento",
      entidad: entidad || "Sin información",
      centroCostos: texto("centroCostos") || "Sin información",
      detalle: detalle,
      tipoInteraccion: texto("tipoInteraccion") || "Sin información",
      categoria: texto("categoria") || "Sin información",
      valorPO: monto("valorPO"),
      valorImpuestos: valorImpuestos,
      valorDolares: obtenerValorDolares_(valorImpuestos, moneda),
      moneda: moneda,
      valorCHF: monto("valorCHF"),
      numeroPO: numeroPO,
      poEnviada: texto("poEnviada"),
      workflow: texto("workflow"),
      busqueda: normalizar_([interaccion, evento, entidad, detalle, numeroPO, texto("pais"), texto("centroCostos")].join(" "))
    };
  }

  function crearAdvertencias_(columnas) {
    const requeridas = { evento: "Nombre del evento", entidad: "HCP/HCO/PROVEEDOR", pais: "País", valorCHF: "Valor en CHF" };
    return Object.keys(requeridas).filter(function(campo) {
      return columnas[campo] < 0;
    }).map(function(campo) {
      return "No se encontró el encabezado esperado: " + requeridas[campo] + ".";
    });
  }

  function valoresUnicos_(registros, campo) {
    return Array.from(new Set(registros.map(function(registro) {
      return registro[campo];
    }).filter(Boolean))).sort(function(a, b) {
      return String(a).localeCompare(String(b), "es");
    });
  }

  function convertirMonto_(visible) {
    let texto = String(visible || "").replace(/[^0-9,.-]/g, "");
    const ultimaComa = texto.lastIndexOf(",");
    const ultimoPunto = texto.lastIndexOf(".");

    if (ultimaComa >= 0 && ultimoPunto >= 0) {
      texto = ultimaComa > ultimoPunto
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto.replace(/,/g, "");
    } else if (ultimaComa >= 0) {
      texto = texto.replace(/,(?=\d{3}(,|$))/g, "").replace(",", ".");
    } else {
      texto = texto.replace(/\.(?=\d{3}(\.|$))/g, "");
    }
    const monto = Number(texto);
    return isNaN(monto) ? null : monto;
  }

  function normalizar_(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function obtenerValorDolares_(valorImpuestos, moneda) {
    if (valorImpuestos === null) return null;
    const monedaNormalizada = normalizar_(moneda);
    if (monedaNormalizada === "usd" || monedaNormalizada === "dolar" || monedaNormalizada === "dolares") {
      return valorImpuestos;
    }
    if (monedaNormalizada === "pen" || monedaNormalizada === "sol" || monedaNormalizada === "soles") {
      return valorImpuestos / CONFIGURACION.PEN_POR_USD;
    }
    return null;
  }

  function obtenerMesAnterior_() {
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const fecha = new Date();
    fecha.setDate(1);
    fecha.setMonth(fecha.getMonth() - 1);
    return meses[fecha.getMonth()] + " " + fecha.getFullYear();
  }

  return { obtenerDatos: obtenerDatos_ };
})();

function doGet() {
  if (!validarConArchivoControl()) return;
  Logger.log("[BCAT-0054] Inicio doGet.");
  try {
    const salida = HtmlService.createHtmlOutputFromFile("Index")
      .setTitle("Dashboard Eventos HCP/HCO | Roche")
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
    Logger.log("[BCAT-0054] Fin doGet: interfaz generada.");
    return salida;
  } catch (error) {
    Logger.log("[BCAT-0054] Error en doGet: " + error.message);
    throw error;
  }
}

function obtenerDatosEventos() {
  if (!validarConArchivoControl()) return;
  Logger.log("[BCAT-0054] Inicio obtenerDatosEventos.");
  try {
    const datos = BCAT0054.obtenerDatos();
    Logger.log("[BCAT-0054] Fin obtenerDatosEventos: " + datos.registros.length + " registros entregados.");
    return datos;
  } catch (error) {
    Logger.log("[BCAT-0054] Error en obtenerDatosEventos: " + error.message);
    throw error;
  }
}

function validarConArchivoControl() {
  const hoja = SpreadsheetApp.openById("1ILqk0fo56GO6zCXUcOWpb41eUQQUrOZDZLgaQuD57VM").getSheetByName("update");
  const estado = hoja.getRange("B2").getValue();
  return estado === "update";
}
