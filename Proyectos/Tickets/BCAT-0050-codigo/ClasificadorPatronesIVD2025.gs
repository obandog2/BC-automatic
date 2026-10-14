/**
 * Programado por: Gabriela Obando
 * Asistente: Agente Samuel
 *
 * ¿Qué hace?
 * Clasifica importaciones como IVD, NO ES IVD o PHARMA mediante patrones de
 * producto. Lee únicamente B:T y escribe el resultado únicamente en V.
 * Las palabras genéricas, la partida, la marca y el comprador solo refuerzan
 * un patrón; no clasifican una fila por sí solas. Los patrones IVD aprobados
 * por negocio tienen prioridad. Además del texto principal F:H, se usa B:T
 * como texto de apoyo exclusivamente para exclusiones NO ES IVD específicas;
 * nunca para crear una coincidencia IVD o PHARMA.
 *
 * Validaciones para ejecutar clasificarIVDPorPatrones2025():
 * 1) La hoja 2025 debe conservar las columnas B:T y la salida V.
 * 2) Los seis diccionarios deben tener Categoría en A, Término en B y Fuerza en C.
 * 3) Cada producto específico debe pertenecer a una sola categoría.
 * 4) Debe existir la función validarConArchivoControl() en el proyecto.
 */

function clasificarIVDPorPatrones2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorPatronesIVD2025.iniciar();
}

function continuarClasificacionIVDPorPatrones2025() {
  if (!validarConArchivoControl()) return;
  return ClasificadorPatronesIVD2025.continuar();
}

function diagnosticarIVDPorPatrones2025(numeroFila) {
  if (!validarConArchivoControl()) return;
  return ClasificadorPatronesIVD2025.diagnosticar(numeroFila);
}

const ClasificadorPatronesIVD2025 = (function() {
  const C = Object.freeze({
    prefijo: '[BCAT-0050-PATRONES]',
    idDiccionario: '1X86L6_Kul-vfdKIDj3xPWNbOEMiPeVvrq0E1cxGXjp4',
    idDestino: '1iDzirC_nfjzXadwa1yPEPA64ObVBt8ej69BJ0F6UGtw',
    hojaDestino: '2025',
    primeraFila: 2,
    columnaInicial: 2,
    columnasLectura: 19,
    columnaSalida: 22,
    filasPorLote: 2500,
    maxMilisegundos: 240000,
    esperaMinutos: 1,
    maxRegex: 10000,
    propiedades: Object.freeze({
      cursor: 'BCAT_0050_PATRONES_CURSOR',
      ultimaFila: 'BCAT_0050_PATRONES_ULTIMA',
      conteos: 'BCAT_0050_PATRONES_CONTEOS'
    }),
    hojas: Object.freeze([
      'KeyWordsDescriptionTraining (M)',
      'IrrelevantWordsTraining (M)',
      'KeyWordsBuyerTraining (M)',
      'IrrelevantWordsBuyerTraining (M)'
    ]),
    hojaMarcas: 'BrandTraining (M)',
    hojaRucs: 'RucTraining (M)',
    pesos: Object.freeze({
      patronFuerte: 10,
      patronDebil: 3,
      terminoFuerte: 3,
      terminoDebil: 1,
      compradorFuerte: 1,
      compradorDebil: 0.5,
      partida: 0.5,
      marca: 0.5,
      fabricante: 0.5,
      marcaEntrenadaFuerte: 2,
      marcaEntrenadaDebil: 0.5,
      rucEntrenadoFuerte: 2,
      rucEntrenadoDebil: 0.5,
      minimo: 7,
      ventaja: 2,
      maxTerminos: 3
    }),
    partidasIVD: ['3822', '300215', '300290', '300630'],
    // Exclusiones confirmadas por negocio. Se usan frases específicas para
    // no convertir en NO ES IVD productos IVD con vocabulario similar.
    patronesNoIVDPrioritarios: [
      'universal trasport medium', 'universal transport medium',
      'anti helicobacter pylori igg', 'anti helicobacter pylori iga',
      'needle cnv', 'tg color gpopap', 'stargel10 panel 11',
      'anti cytokeratin 5 6', 'unified gateway', 'hypodermic needle',
      'piercer no 20', 'tubos tp roja 9ml', 'tubo tapa blanca sin aditivos',
      'planar pct2235', 'hba1c columna hplc equipo h9',
      'so interbnal barcode scan', 'centrifugue', 'guidewire 0 035 x260sr',
      'aqua liner', 'liqui nox', 'femur estabilizado',
      'porta objetos electrocargado', 'prueba rapida h pylori antibody',
      'sp water tank assembly', 'water tank assembly', 'substrate reservoir',
      'sp cover assy rear ia', 'bft ii anayzer dispo sy', 'tube urin plc',
      'pcb usm monitor', 'tubo ependorf', 'tubo eppendorf',
      'ldl colesterol monof', 'allplex h pylori clair assay',
      'allplex h pylori clarir assay', 'pre treatment unit decarbonizer',
      'anaerogen 2 5 l', 'conjunto de tubos para circulacion',
      'ultramax terapia combinada', 'blister 1ml insulin',
      'syringe 10ml lock w', 'us dual', 'urea 275',
      'cre8 stent coronario', 'tgp alt 330', 'tgo 330', 'vitek ms chca',
      'tablet surface pro 7', 'alinty monitor', 'alinity monitor',
      'proportional solenoid valve', 'bhuman chorionic gonadotropin',
      'infinicyt ruo with dongle', 'hemosil recombiplastin 2g',
      'optisol xl 750', 'alnty ci rgt cool', 'ridagene helicobacter pylori',
      // Familias revisadas contra la clasificación humana: son productos,
      // controles o consumibles que negocio definió explícitamente como NO IVD.
      'xn check', 'env flex high ph',
      'h pylori antigen rapid test cassette', 'h pylori antigen feces cassette',
      'h pylori ag rapid test cassette', 'h pylori antibody rapid test cassette',
      'anti h pylori antigen', 'standard f h pylori ag fia',
      'm 6fr', 'm 6fd', 'm 6ln', 'm 6lh', 'm 6ld', 'm 6d',
      '105 012288', '105 012290', '105 012292', '105 012296', '105 012298',
      '105 009398', 'tdr staph 96 int', '040 001487',
      'gem3 3 5kbg ise gl300iqm',
      'crphs', 'glycosylated hemoglobin hba1c',
      'roaccutan capsulas', 'roaccutane capsulas'
    ],
    // Regla = partida arancelaria compatible + descripción concreta.
    // No se usa ni la marca ni la partida por sí solas.
    reglasNoIVDCompuestas: [
      { partidas: ['9018'], patrones: [
        'maquina de dialisis', 'maquina para hd', 'blood tubing set',
        'jeringa', 'syringe', 'cateter', 'macro drop', 'macro 20 drops',
        'micro drop', 'surefuser', 'tulip avf', 'ultrafilter cf',
        'llave de tres vias', 'bomba de infusion', 'lancet cont act',
        'aguja multiple vacuette', 'imugard', 'trima accel',
        'cardioplegia', 'capiox', 'pb 4ao', 'pb 2cd', 'spectra optia',
        'adult simple pack', 'monitor fetal', 'riformer'
      ] },
      { partidas: ['2836'], patrones: ['bicarbonato', 'bicarbonate', 'niprocart'] },
      { partidas: ['9019'], patrones: ['baby fx oxy', 'oxigenoterapia', 'aerosolterapia'] },
      { partidas: ['8419'], patrones: ['esterilizador', 'sterilizer'] },
      { partidas: ['8421'], patrones: [
        'ultrafilter cf', 'endotoxin filter para maquinas ncu',
        'hemofilter', 'dialyzer elisio', 'filter mesh felt',
        'erba xl200640 filter'
      ] },
      { partidas: ['9011'], patrones: ['microscopio', 'microscope', 'eclipse ei'] },
      { partidas: ['9012'], patrones: ['ultrasonido', 'ultrasound', 'ivus', 'makoto'] },
      { partidas: ['8418'], patrones: ['refrigerador para banco de sangre', '25 grados c freezer'] },
      { partidas: ['8414'], patrones: [
        'bomba de vacio', 'bomba vacio', 'vacuum pump protector', 'compressor dk50'
      ] },
      { partidas: ['8413'], patrones: ['roller peristaltic pump', 'pipetter s1 assy'] },
      { partidas: ['8471'], patrones: ['datalogger', 'unified gateway'] },
      { partidas: ['8479'], patrones: ['processing station', 'carousel benchmark'] },
      { partidas: ['8481'], patrones: ['valve', 'valvulas', 'blt assy'] },
      { partidas: ['8504'], patrones: ['ups', 'fuente de alimentacion'] },
      { partidas: ['8507'], patrones: ['baterias para maquinas de dialisis'] },
      { partidas: ['8539'], patrones: ['lamp halogen assy', 'lampara halogen'] },
      { partidas: ['8544'], patrones: ['usb extension cable'] },
      { partidas: ['8443'], patrones: ['thermal printer', 'slide thermal printer', 'tissue cassette thermal printer', 'printer zebra'] },
      { partidas: ['9013'], patrones: ['ensamble laser he ne'] },
      { partidas: ['9018'], patrones: [
        'scalp vein set', 'aguja pericraneal', 'set de infusion desechable',
        'hemoperfusion cartridge', 'cartucho desechable de hemoperfusion',
        'equipos de transfusion de plaquetas', 'sc w017 scd wafer',
        'pb 1cd', 'pb 3cd', 'pb3cd', 'torniquete', 'guante quirurgico',
        'dispositivo medico rovers', 'cervex brush combi', 'set de diagnostico economico',
        'equipo ondas de choque', 'cono coneccion', 'ultrasonido de mando multifuncion',
        'pieza de mano', 'vario surg'
      ] },
      { partidas: ['9021'], patrones: [
        'tapon de clavo', 'bandeja inserto tibial', 'polarstem collar case',
        'mk ps standard knee', 'mk femoral'
      ] },
      { partidas: ['9022'], patrones: ['rayos x digital panoramico', 'veraview ic5'] },
      { partidas: ['9030'], patrones: ['sensor intraoral'] },
      { partidas: ['9603'], patrones: ['cepillo endocervical', 'cervical brush'] },
      { partidas: ['9612'], patrones: ['ribbon', 'ebar printer'] },
      { partidas: ['7312'], patrones: ['cleaning wire'] },
      { partidas: ['7326'], patrones: ['soporte equipo'] },
      { partidas: ['4202'], patrones: ['case 90 xl', 'maleta'] },
      { partidas: ['4014', '4015'], patrones: ['torniquete', 'guante quirurgico'] },
      { partidas: ['3404'], patrones: ['parafina biowax', 'paraffin 56 58'] },
      { partidas: ['3306'], patrones: ['revelador placa bacteriana', 'ditonos'] },
      { partidas: ['3910'], patrones: ['silicon grease', 'lubricant grease', 'grease afc'] },
      { partidas: ['3917'], patrones: ['tube flex', 'tubo flex'] },
      { partidas: ['3923'], patrones: ['round petri plate', 'consumables storage box'] },
      { partidas: ['3926'], patrones: ['tool gripper adjustment', 'junta de tubo gastat'] },
      { partidas: ['9028'], patrones: ['technician meter', 'calibracion para maquinas de dialisis'] },
      { partidas: ['3822'], patrones: ['tubo de extraccion'] },
      { partidas: ['9027'], patrones: [
        'vc vitek2 compac 60 clinical', 'sc 120 auto silde maker',
        '3210b pa00071 sc 120', 'sqa vision packed device', 'cell saber elite',
        'cassette printer', 'slide printer', 'stargel satellite reader',
        'stargel centrifuge', 'microblot array reader',
        'mini ise eloctrolyte analizer', 'analizador automatico de grupos sanguineos',
        'automatic blood group analyzer', 'cx23lfs1k', 'rotary microtome',
        'virus collection and transport set', 'transparent water bath',
        'manual coagulometer diamond', 'microscope cover glass',
        'incubator assembly', 'tissue tek uni cassette', 'tissue tek coverslipping film',
        'embedding cassette', 'hemocue cleaner', 'low profile tube strip',
        'eu 8 tube strip', 'aircomfy daydream', 'dream wear', 'belt tmg',
        'spring 10 67x', 'pipe ptfe', 'cable pipette head',
        'me sc203a tscd sterile tubing welder', 'thermal electric device',
        'ise unit al assy', 'instrumento para analisis quimico',
        'stargel incubator', 'pre dilution block adapter', 'refractometro',
        'equipo de bano maria', 'mk ps standard knee', 'mk femoral'
      ] }
    ],
    patronesIVDPrioritarios: [
      // Familias específicas confirmadas como IVD. Estas reglas están antes
      // de PHARMA porque el nombre de un analito/medicamento puede formar
      // parte de un reactivo diagnóstico (p. ej. MTX, VANC3 o fenobarbital).
      'cobas p 512 sealer', 'thrombolyzer compact x', 'an993713 cv 11 complete',
      'cv 11 complete', 'centrifugadora centrifugue',
      'a1cx3', 'measuring cell with ref elect',
      'reaction cell c 503', 'reaction cell c 513', '801 ba80 00222 00 lamp12v 20w',
      'tenidor de tejidos con estacion de secado',
      'dimension methotrexate', 'mtx calibrator',
      'reactivo para determinacion cuantitativa del metotrexato',
      'vanc3', 'online tdm phenobarbital', 'mem10 meropenem', 'vmem10 meropenem',
      'alinity c phenobarbital', 'imm 2000 alergeno amoxicilina',
      'crea s kit 800', 'crea s kit800', 'cre1204',
      'pico a jeringa arterial y venosa', 'slide stainer',
      'nipro premier alpha kit glucometer', 'tube edta plh', 'bf diluent',
      'cobas pro sb', 'ldl0102 ldl c kit', 'ldl c kit', 'hdl0102 hdl c kit',
      'hdl c kit', 'maglumi reaction cup', 'rp400 cartucho aqc', 'bc ret',
      'crp4', 'tip core tips with filter', 'micro albumin',
      'hemocue hb 201 analyzer', 'ultraview universal dab detection kit',
      'hivclia kit', 'ft 4 kit', 'ccmcontroll', 'anti ss b',
      'wash waste kit', 'hu cd45 hrzn v500 mab',
      'urised mini urine microscopy analyzer', 'ca clean solution',
      'panel phoenix', 'lip0104 lip kit', 'lip kit',
      'tdr x060 blood culture systems', 'aso crp rf ii con kit', 'hba1c kit',
      'innovance d dimero', 'vacuum blood collection tube edtak2',
      'control hematologico bc 5d', 'uf control uck 900a',
      'anticoagulant citrate dextrose solution', 'confirm anti ki 67',
      'assaytip assaycup tray', 'rp500 mcart lac', 'pipette tips yellow',
      'gastropanel quick test', 'reaction cell for cobas c 303',
      'kit with binocular', 'tubo al vacio kj1002z'
    ],
    patronesIVDConContexto: [
      { patron: 'accesorio de equipo', contextos: ['roche', 'roche diagnostics'] },
      { patron: 'equipo de diagnostico', contextos: ['credo diagnostics', 'bio molecular systems'] },
      { patron: 'supply parts', contextos: ['sysmex'] },
      { patron: 'modulo transportador', contextos: ['cobas pro', 'roche'] },
      { patron: 'equipo analizador de muestras', contextos: ['cobas pro', 'roche'] },
      { patron: 'modulo de medicion', contextos: ['lifotronic'] },
      { patron: 'reaction cell', contextos: ['roche', 'cobas'] },
      { patron: 'kit with binocular', contextos: ['evident'] },
      // Falsos negativos repetidos: se exige la familia específica y, cuando
      // el nombre es genérico, también su fabricante/marca correspondiente.
      { patron: 'nova view instrument', contextos: ['werfen'] },
      { patron: 'sensor cassette sc90', contextos: ['radiometer'] },
      { patron: 'ap22 if elite 2', contextos: ['werfen'] },
      { patron: 'alinity ci series system', contextos: ['abbott'] },
      { patron: 'gel clot activator tube', contextos: ['jiangsu mole'] },
      { patron: 'centrifugadora centrifugue', contextos: ['bioridge'] },
      { patron: 'systec mediaprep 10', contextos: ['systec'] },
      { patron: 'cert pre owned gx module', contextos: ['cepheid'] },
      { patron: 'modulo gx de segunda mano', contextos: ['cepheid'] },
      { patron: 'kit data logger global', contextos: ['medical systems'] },
      { patron: 'kit de mantenimiento', contextos: ['euroimmun'] },
      { patron: 'accesorio de equipo', contextos: ['qiagen'] }
    ],
    pharmaDirecto: [
      'medicamento para uso humano', 'ocrevus', 'ocrelizumab', 'hemlibra', 'emicizumab',
      'kadcyla', 'perjeta', 'phesgo', 'avastin', 'herceptin', 'actemra', 'alecensa',
      'zelboraf', 'mabthera', 'evrysdi', 'pulmozyme', 'vabysmo', 'tecentriq',
      'trastuzumab', 'rituximab', 'tocilizumab', 'bevacizumab', 'pertuzumab',
      'atezolizumab', 'risdiplam', 'entrectinib', 'amoxicilina', 'ceftriaxona',
      'meropenem', 'vancomicina', 'phenobarbital', 'metotrexato', 'methotrexate'
    ],
    marcasIVD: new Set([
      'abbott', 'agappe', 'becton dickinson', 'bio rad', 'biomerieux', 'cepheid', 'dirui',
      'dymind', 'edan', 'euroimmun', 'genrui', 'human', 'lifotronic', 'maccura', 'mindray',
      'orgentec', 'sebia', 'siemens', 'snibe', 'sysmex', 'vircell', 'werfen', 'zybio',
      'yhlo', 'aesku', 'stago', 'keyu', 'wondfo', 'roche', 'agilent', 'acon', 'ab medical',
      'accubiotech', 'bioneer', 'bio optica', 'biohit', 'grifols', 'qiagen', 'radiometer',
      'terumo', 'thermo fisher', 'tosoh', '77 elektronika', 'hemocue', 'seegene', 'unico',
      'urit', 'diamond', 'nipro', 'greiner bio one', 'htl strefa', 'evident', 'nikon',
      'memmert', 'celltrazone', 'haosilin', 'caretium', 'cdg biotech', 'atlas medical',
      'spinreact', 'erba', 'dia pro', 'biobase', 'aehealth', 'bio sb', 'diatron',
      'citotest', 'dc fine chemicals', 'beckman coulter', 'nova biomedical', 'wiener',
      'operon', 'monobind', 'elitechgroup', 'eurospital', 'raf solutions', 'cer test',
      'certest', 'ryvex', 'exias medical', 'haemonetics', 'slee', 'sakura', 'yd'
    ]),
    fabricantesIVD: new Set([
      'roche diagnostics', 'sysmex america', 'siemens healthineers', 'abbott',
      'becton dickinson', 'bio rad', 'biomerieux', 'euroimmun', 'mindray', 'snibe',
      'werfen', 'orgentec', 'molbio diagnostics', 'diagnostica stago', 'one lambda',
      'wondfo', 'keyu biological', 'tosoh bioscience', 'qiagen', 'grifols diagnostic',
      'radiometer medical', '77 elektronika', 'hemocue', 'bioneer corporation',
      'shenzhen new industries', 'seegene', 'bio optica'
    ]),
    indicadoresProductoIVD: [
      'analizador', 'analyzer', 'assay', 'buffer', 'calibr', 'control', 'cuvette', 'cup',
      'diagnostico', 'diluent', 'diluyente', 'hematolog', 'kit', 'reactivo', 'reagent',
      'tira', 'strip', 'test', 'tube', 'tubo', 'urine', 'orina', 'wash', 'blood', 'sangre',
      'cobas', 'atellica', 'maglumi', 'urised', 'hematology', 'electrolyte', 'microalbumin',
      'coagulation', 'glucose', 'hba1c', 'hiv', 'hpv', 'pcr', 'clia', 'elisa', 'prueba',
      'panel', 'cbc', 'bnp', 'epoc', 'ft3', 'ft4', 'ca15', 'ca72', 'triglycerides',
      'insulin', 'creatin', 'instrument', 'instrumento', 'sistema', 'system', 'pack',
      'cartridge', 'cartucho', 'detergent', 'detergente', 'bomba', 'microscope', 'microscopio',
      'determinacion', 'cuantitativa', 'cuantitativo', 'solucion', 'lisante', 'lyse',
      'micropipette', 'pipeta', 'microplaca', 'microplate', 'lavador', 'lavadora', 'petri',
      'electrodo', 'electrode', 'sodium', 'potassium', 'chloride', 'lipase', 'amylase',
      'urea', 'ammonia', 'dengue', 'herpes', 'hbsag', 'ebv', 'tsh', 'cortisol', 'vitamin',
      'crp', 'glucosa', 'ast', 'got', 'rbc', 'wbc', 'primer', 'sensor', 'cervical',
      'sampling', 'muestra', 'preparaciones', 'microscopicos', 'staining', 'hematoxylin',
      'analisis', 'laboratorio', 'equipo', 'equipos', 'accesorio', 'accesorios',
      'repuesto', 'repuestos', 'consumible', 'consumibles', 'herramienta'
    ],
    palabrasGenericas: new Set([
      'accesorio', 'accesorios', 'analisis', 'analizador', 'aparato', 'aparatos', 'articulo',
      'articulos', 'caja', 'componente', 'componentes', 'consumible', 'consumibles',
      'diagnostico', 'diagnosticos', 'equipo', 'equipos', 'insumo', 'insumos', 'instrumento',
      'instrumentos', 'kit', 'laboratorio', 'material', 'parte', 'partes', 'producto',
      'productos', 'reactivo', 'reactivos', 'repuesto', 'repuestos', 'set', 'sistema',
      'solucion', 'tubo', 'tubos', 'unidad', 'unidades'
    ]),
    palabrasEmpresaIgnoradas: new Set([
      'sa', 's', 'a', 'cia', 'ltda', 'inc', 'corp', 'corporation', 'company', 'co',
      'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'sociedad', 'anonima', 'limited'
    ])
  });

  function iniciar() {
    borrarTriggers_();
    const hoja = obtenerHojaDestino_();
    const props = PropertiesService.getScriptProperties();
    hoja.getRange(1, C.columnaSalida).setValue('Clasificación IVD');
    props.setProperty(C.propiedades.cursor, String(C.primeraFila));
    props.setProperty(C.propiedades.ultimaFila, String(hoja.getLastRow()));
    props.setProperty(C.propiedades.conteos, JSON.stringify({ IVD: 0, 'NO ES IVD': 0, PHARMA: 0 }));
    return procesar_();
  }

  function continuar() {
    return procesar_();
  }

  function procesar_() {
    let bloqueo;
    try {
      bloqueo = LockService.getScriptLock();
      bloqueo.waitLock(30000);
      const props = PropertiesService.getScriptProperties();
      let cursor = Number(props.getProperty(C.propiedades.cursor));
      const ultima = Number(props.getProperty(C.propiedades.ultimaFila));
      if (!cursor || cursor > ultima) return finalizar_();

      const reglas = cargarReglas_();
      const hoja = obtenerHojaDestino_();
      const conteos = leerConteos_();
      const inicio = Date.now();
      const primeraProcesada = cursor;

      while (cursor <= ultima && Date.now() - inicio < C.maxMilisegundos) {
        const hasta = Math.min(cursor + C.filasPorLote - 1, ultima);
        const cantidad = hasta - cursor + 1;
        const filas = hoja.getRange(cursor, C.columnaInicial, cantidad, C.columnasLectura).getDisplayValues();
        const detalles = filas.map(function(fila) { return evaluar_(fila, reglas); });
        hoja.getRange(cursor, C.columnaSalida, cantidad, 1)
          .setValues(detalles.map(function(detalle) { return [detalle.resultado]; }))
          .setNumberFormat('@');
        detalles.forEach(function(detalle) { conteos[detalle.resultado]++; });
        cursor = hasta + 1;
        props.setProperty(C.propiedades.cursor, String(cursor));
      }

      props.setProperty(C.propiedades.conteos, JSON.stringify(conteos));
      Logger.log(C.prefijo + ' Lote procesado. | filas: ' + primeraProcesada + '-' + (cursor - 1));
      if (cursor > ultima) return finalizar_();
      programarContinuacion_();
      return { estado: 'EN PROCESO', desdeFila: primeraProcesada, hastaFila: cursor - 1, siguienteFila: cursor };
    } catch (error) {
      Logger.log(C.prefijo + ' ERROR. | ' + error.message);
      throw error;
    } finally {
      if (bloqueo && bloqueo.hasLock()) bloqueo.releaseLock();
    }
  }

  function diagnosticar(numeroFila) {
    const fila = Number(numeroFila);
    if (!Number.isInteger(fila) || fila < C.primeraFila) throw new Error('Indica una fila válida.');
    const datos = obtenerHojaDestino_().getRange(fila, C.columnaInicial, 1, C.columnasLectura).getDisplayValues()[0];
    const detalle = evaluar_(datos, cargarReglas_());
    Logger.log(C.prefijo + ' Diagnóstico fila ' + fila + '. | ' + JSON.stringify(detalle));
    return detalle;
  }

  function evaluar_(fila, reglas) {
    // El arreglo empieza en B y termina en T. No se usa ninguna columna posterior.
    const comprador = normalizar_(fila[0]);       // B
    const ruc = normalizar_(fila[1]);              // C
    const partida = String(fila[2] || '').replace(/[^0-9]/g, ''); // D
    const descripcion = normalizar_([fila[4], fila[5], fila[6]].join(' ')); // F + G + H
    // B:T sirve como apoyo cuando un código, modelo o detalle está repartido
    // entre columnas. No reemplaza F:H ni se usa para inferir IVD/PHARMA.
    const textoApoyo = normalizar_(fila.join(' '));
    const marca = normalizar_(fila[6]);           // H
    const fabricante = normalizar_(fila[18]);     // T
    const puntos = { IVD: 0, 'NO ES IVD': 0, PHARMA: 0 };
    const evidencia = [];

    const ivdPrioritario = obtener_(descripcion, reglas.ivdPrioritario);
    if (ivdPrioritario.length) {
      return detalle_('IVD', puntos, ['Patrón IVD aprobado: ' + ivdPrioritario.join(', ')]);
    }

    const noIVDPrioritario = obtener_(descripcion, reglas.noIVDPrioritario);
    if (noIVDPrioritario.length) {
      return detalle_('NO ES IVD', puntos, ['Exclusión NO ES IVD aprobada: ' + noIVDPrioritario.join(', ')]);
    }

    const textoProducto = normalizar_([fila[4], fila[5]].join(' ')); // F + G, sin marca.
    const reglaNoIVDCompuesta = resolverNoIVDCompuesto_(partida, textoProducto, C.reglasNoIVDCompuestas);
    if (reglaNoIVDCompuesta.length) {
      return detalle_('NO ES IVD', puntos, ['Regla NO ES IVD: partida + descripción: ' + reglaNoIVDCompuesta.join(', ')]);
    }

    const pharma = obtener_(descripcion, reglas.descripcion.PHARMA.FUERTE);
    if (pharma.length) return detalle_('PHARMA', puntos, ['PHARMA fuerte: ' + pharma.join(', ')]);

    const patrones = obtenerPatrones_(descripcion, reglas.descripcion);
    const exclusionNoIVD = resolverNoIVDEspecifico_(patrones);
    if (exclusionNoIVD.length) {
      return detalle_('NO ES IVD', puntos, ['Exclusión específica NO ES IVD: ' + exclusionNoIVD.join(', ')]);
    }

    const contextoIVD = obtenerContextosIVD_(descripcion, comprador, marca, fabricante, reglas.ivdConContexto);
    if (contextoIVD.length) {
      return detalle_('IVD', puntos, ['Patrón IVD con contexto: ' + contextoIVD.join(', ')]);
    }

    const patronIVD = resolverIVDEspecifico_(patrones);
    if (patronIVD.length) return detalle_('IVD', puntos, ['Patrón específico IVD: ' + patronIVD.join(', ')]);

    if (tieneContextoIVD_(descripcion, comprador, marca, fabricante, reglas.compradores)) {
      return detalle_('IVD', puntos, ['Contexto IVD compuesto: producto diagnóstico + comprador, marca o fabricante IVD']);
    }

    // Última exclusión antes de puntuar: solo términos NO ES IVD FUERTE y
    // específicos hallados en la fila completa. Se evalúa después de las
    // reglas IVD explícitas para conservar los falsos negativos ya corregidos.
    const exclusionNoIVDApoyo = obtener_(textoApoyo, reglas.descripcion['NO ES IVD'].FUERTE)
      .filter(esPatronEspecifico_);
    if (exclusionNoIVDApoyo.length) {
      return detalle_('NO ES IVD', puntos, ['Exclusión NO ES IVD por texto de apoyo B:T: ' + exclusionNoIVDApoyo.join(', ')]);
    }

    puntuarPatrones_(puntos, evidencia, patrones);
    puntuarComprador_(puntos, evidencia, comprador, reglas.compradores);
    puntuarRucEntrenado_(puntos, evidencia, ruc, reglas.rucs);
    puntuarMarcaEntrenada_(puntos, evidencia, marca, reglas.marcas);
    puntuarContexto_(puntos, evidencia, partida, marca, fabricante, reglas.marcas);

    return detalle_(decidir_(puntos, patrones), puntos, evidencia);
  }

  function obtenerPatrones_(descripcion, grupos) {
    const salida = crearCoincidencias_();
    ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        salida[categoria][fuerza] = obtener_(descripcion, grupos[categoria][fuerza]);
      });
    });
    return salida;
  }

  function resolverNoIVDEspecifico_(patrones) {
    return patrones['NO ES IVD'].FUERTE.filter(esPatronEspecifico_);
  }

  function resolverNoIVDCompuesto_(partida, textoProducto, reglas) {
    return reglas.filter(function(regla) {
      const partidaCompatible = regla.partidas.some(function(prefijo) {
        return partida.indexOf(prefijo) === 0;
      });
      return partidaCompatible && regla.patrones.some(function(patron) {
        return contieneFrase_(textoProducto, patron);
      });
    }).map(function(regla) {
      return regla.partidas.join('/') + ' + ' + regla.patrones.filter(function(patron) {
        return contieneFrase_(textoProducto, patron);
      }).join(', ');
    });
  }

  function resolverIVDEspecifico_(patrones) {
    return patrones.IVD.FUERTE.filter(esPatronEspecifico_);
  }

  function puntuarPatrones_(puntos, evidencia, patrones) {
    ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        const especificos = patrones[categoria][fuerza].filter(esPatronEspecifico_).slice(0, C.pesos.maxTerminos);
        const generales = patrones[categoria][fuerza].filter(function(termino) {
          return !esPatronEspecifico_(termino) && !esGenerico_(termino);
        }).slice(0, C.pesos.maxTerminos);
        const pesoPatron = fuerza === 'FUERTE' ? C.pesos.patronFuerte : C.pesos.patronDebil;
        const pesoTermino = fuerza === 'FUERTE' ? C.pesos.terminoFuerte : C.pesos.terminoDebil;
        sumar_(puntos, evidencia, categoria, especificos, pesoPatron, 'Patrón ' + fuerza);
        sumar_(puntos, evidencia, categoria, generales, pesoTermino, 'Término ' + fuerza);
      });
    });
  }

  function puntuarComprador_(puntos, evidencia, comprador, grupos) {
    ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        const encontrados = compradoresSimilares_(comprador, grupos[categoria][fuerza]);
        if (!encontrados.length) return;
        agregar_(puntos, evidencia, categoria, fuerza === 'FUERTE' ? C.pesos.compradorFuerte : C.pesos.compradorDebil,
          'Comprador ' + categoria + ' ' + fuerza + ': ' + encontrados[0]);
      });
    });
  }

  function puntuarMarcaEntrenada_(puntos, evidencia, marca, grupos) {
    // La marca solo suma evidencia: nunca alcanza por sí sola el mínimo de decisión.
    ['IVD', 'NO ES IVD'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        const encontradas = Array.from(grupos[categoria][fuerza]).filter(function(marcaEntrenada) {
          return contieneFrase_(marca, marcaEntrenada);
        });
        if (!encontradas.length) return;
        const peso = fuerza === 'FUERTE' ? C.pesos.marcaEntrenadaFuerte : C.pesos.marcaEntrenadaDebil;
        agregar_(puntos, evidencia, categoria, peso,
          'Marca entrenada ' + categoria + ' ' + fuerza + ': ' + encontradas[0]);
      });
    });
  }

  function puntuarRucEntrenado_(puntos, evidencia, ruc, grupos) {
    // El RUC es una señal histórica; por sí solo tampoco alcanza el mínimo.
    ['IVD', 'NO ES IVD'].forEach(function(categoria) {
      ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
        if (!coincideConjunto_(ruc, grupos[categoria][fuerza])) return;
        const peso = fuerza === 'FUERTE' ? C.pesos.rucEntrenadoFuerte : C.pesos.rucEntrenadoDebil;
        agregar_(puntos, evidencia, categoria, peso,
          'RUC entrenado ' + categoria + ' ' + fuerza + ': ' + ruc);
      });
    });
  }

  function puntuarContexto_(puntos, evidencia, partida, marca, fabricante, marcasEntrenadas) {
    if (C.partidasIVD.some(function(prefijo) { return partida.indexOf(prefijo) === 0; })) {
      agregar_(puntos, evidencia, 'IVD', C.pesos.partida, 'Partida compatible');
    }
    const marcaConfirmadaNoIVD = coincideConjunto_(marca, marcasEntrenadas['NO ES IVD'].FUERTE);
    if (!marcaConfirmadaNoIVD && coincideConjunto_(marca, C.marcasIVD)) {
      agregar_(puntos, evidencia, 'IVD', C.pesos.marca, 'Marca compatible');
    }
    if (coincideConjunto_(fabricante, C.fabricantesIVD)) agregar_(puntos, evidencia, 'IVD', C.pesos.fabricante, 'Fabricante compatible');
  }

  function decidir_(puntos, patrones) {
    if (puntos.PHARMA >= C.pesos.minimo && puntos.PHARMA >= puntos.IVD + C.pesos.ventaja &&
        puntos.PHARMA >= puntos['NO ES IVD'] + C.pesos.ventaja) return 'PHARMA';
    if (puntos.IVD >= C.pesos.minimo && puntos.IVD >= puntos['NO ES IVD'] + C.pesos.ventaja) return 'IVD';
    if (puntos['NO ES IVD'] >= C.pesos.minimo && puntos['NO ES IVD'] >= puntos.IVD + C.pesos.ventaja) return 'NO ES IVD';

    // Sin un patrón descriptivo suficiente se conserva el resultado conservador.
    return 'NO ES IVD';
  }

  function cargarReglas_() {
    const libro = SpreadsheetApp.openById(C.idDiccionario);
    const salida = {
      descripcion: crearGrupos_(),
      compradores: crearGrupos_(),
      marcas: crearGrupos_(),
      rucs: crearGrupos_(),
      noIVDPrioritario: compilar_(C.patronesNoIVDPrioritarios),
      ivdPrioritario: compilar_(C.patronesIVDPrioritarios),
      ivdConContexto: C.patronesIVDConContexto
    };
    C.hojas.forEach(function(nombre) {
      const hoja = libro.getSheetByName(nombre);
      if (!hoja || hoja.getLastRow() < 2) return;
      const esComprador = nombre.indexOf('Buyer') !== -1;
      hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getDisplayValues().forEach(function(fila) {
        const categoria = categoria_(fila[0]);
        const termino = normalizar_(fila[1]);
        if (!categoria || termino.length < 3) return;
        (esComprador ? salida.compradores : salida.descripcion)[categoria][fuerza_(fila[2])].add(termino);
      });
    });
    const hojaMarcas = libro.getSheetByName(C.hojaMarcas);
    if (hojaMarcas && hojaMarcas.getLastRow() >= 2) {
      hojaMarcas.getRange(2, 1, hojaMarcas.getLastRow() - 1, 3).getDisplayValues().forEach(function(fila) {
        const categoria = categoria_(fila[0]);
        const marca = normalizar_(fila[1]);
        if (!marca || (categoria !== 'IVD' && categoria !== 'NO ES IVD')) return;
        salida.marcas[categoria][fuerza_(fila[2])].add(marca);
      });
    }
    const hojaRucs = libro.getSheetByName(C.hojaRucs);
    if (hojaRucs && hojaRucs.getLastRow() >= 2) {
      hojaRucs.getRange(2, 1, hojaRucs.getLastRow() - 1, 3).getDisplayValues().forEach(function(fila) {
        const categoria = categoria_(fila[0]);
        const ruc = normalizar_(fila[1]);
        if (!ruc || (categoria !== 'IVD' && categoria !== 'NO ES IVD')) return;
        salida.rucs[categoria][fuerza_(fila[2])].add(ruc);
      });
    }
    ['descripcion', 'compradores'].forEach(function(tipo) {
      ['IVD', 'NO ES IVD', 'PHARMA'].forEach(function(categoria) {
        ['FUERTE', 'DEBIL'].forEach(function(fuerza) {
          const terminos = Array.from(salida[tipo][categoria][fuerza]).sort(function(a, b) { return b.length - a.length; });
          salida[tipo][categoria][fuerza] = tipo === 'descripcion' ? compilar_(terminos) : terminos;
        });
      });
    });
    C.pharmaDirecto.forEach(function(termino) { salida.descripcion.PHARMA.FUERTE.push(compilar_([termino])[0]); });
    return salida;
  }

  function obtenerContextosIVD_(descripcion, comprador, marca, fabricante, reglas) {
    const contexto = [comprador, marca, fabricante].join(' ');
    return reglas.filter(function(regla) {
      if (!contieneFrase_(descripcion, regla.patron)) return false;
      return regla.contextos.some(function(termino) { return contieneFrase_(contexto, termino); });
    }).map(function(regla) {
      return regla.patron + ' + contexto';
    });
  }

  function crearGrupos_() {
    return {
      IVD: { FUERTE: new Set(), DEBIL: new Set() },
      'NO ES IVD': { FUERTE: new Set(), DEBIL: new Set() },
      PHARMA: { FUERTE: new Set(), DEBIL: new Set() }
    };
  }

  function crearCoincidencias_() {
    return {
      IVD: { FUERTE: [], DEBIL: [] },
      'NO ES IVD': { FUERTE: [], DEBIL: [] },
      PHARMA: { FUERTE: [], DEBIL: [] }
    };
  }

  function categoria_(valor) {
    const categoria = normalizar_(valor).toUpperCase();
    if (categoria === 'IVD' || categoria === 'PHARMA') return categoria;
    return categoria === 'NO ES IVD' || categoria === 'NO IVD' ? 'NO ES IVD' : '';
  }

  function fuerza_(valor) {
    return normalizar_(valor).toUpperCase() === 'FUERTE' ? 'FUERTE' : 'DEBIL';
  }

  function compilar_(terminos) {
    const grupos = [];
    let grupo = [];
    let longitud = 0;
    Array.from(new Set(terminos)).forEach(function(termino) {
      const seguro = escapar_(termino);
      if (grupo.length && longitud + seguro.length + 1 > C.maxRegex) {
        grupos.push(grupo);
        grupo = [];
        longitud = 0;
      }
      grupo.push(seguro);
      longitud += seguro.length + 1;
    });
    if (grupo.length) grupos.push(grupo);
    return grupos.map(function(actual) {
      return new RegExp('(?:^|[^a-z0-9])(' + actual.join('|') + ')(?=$|[^a-z0-9])', 'g');
    });
  }

  function obtener_(texto, patrones) {
    const encontrados = new Set();
    patrones.forEach(function(patron) {
      patron.lastIndex = 0;
      let coincidencia;
      while ((coincidencia = patron.exec(texto)) !== null) encontrados.add(coincidencia[1]);
      patron.lastIndex = 0;
    });
    return Array.from(encontrados).sort();
  }

  function esPatronEspecifico_(termino) {
    const palabras = termino.split(' ').filter(Boolean);
    const utiles = palabras.filter(function(palabra) { return !C.palabrasGenericas.has(palabra); });
    return (utiles.length >= 2 && termino.length >= 8) || termino.length >= 10;
  }

  function esGenerico_(termino) {
    const palabras = termino.split(' ').filter(Boolean);
    return palabras.length === 1 && C.palabrasGenericas.has(palabras[0]);
  }

  function compradoresSimilares_(comprador, candidatos) {
    if (!comprador) return [];
    const palabras = palabrasEmpresa_(comprador);
    const compacto = comprador.replace(/\s/g, '');
    return candidatos.filter(function(candidato) {
      const candidatoCompacto = candidato.replace(/\s/g, '');
      if (comprador.indexOf(candidato) !== -1 || candidato.indexOf(comprador) !== -1 || compacto.indexOf(candidatoCompacto) !== -1) return true;
      const otras = palabrasEmpresa_(candidato);
      if (palabras.length < 2 || otras.length < 2) return false;
      const comunes = otras.filter(function(palabra) { return palabras.indexOf(palabra) !== -1; }).length;
      return comunes / otras.length >= 0.8;
    });
  }

  function palabrasEmpresa_(texto) {
    return normalizar_(texto).split(' ').filter(function(palabra) {
      return palabra.length >= 3 && !C.palabrasEmpresaIgnoradas.has(palabra);
    });
  }

  function coincideConjunto_(texto, conjunto) {
    return Array.from(conjunto).some(function(valor) { return (' ' + texto + ' ').indexOf(' ' + valor + ' ') !== -1; });
  }

  function contieneFrase_(texto, frase) {
    return (' ' + texto + ' ').indexOf(' ' + frase + ' ') !== -1;
  }

  function tieneContextoIVD_(descripcion, comprador, marca, fabricante, compradores) {
    const tieneProductoDiagnostico = C.indicadoresProductoIVD.some(function(indicador) {
      return contieneFrase_(descripcion, indicador);
    });
    const compradorIVD = compradoresSimilares_(comprador, compradores.IVD.FUERTE)
      .concat(compradoresSimilares_(comprador, compradores.IVD.DEBIL)).length > 0;
    const marcaIVD = coincideConjunto_(marca, C.marcasIVD);
    const fabricanteIVD = coincideConjunto_(fabricante, C.fabricantesIVD);
    const fuenteIVD = marcaIVD || fabricanteIVD;
    // La combinación comprador IVD + fabricante/marca IVD identifica accesorios y
    // módulos cuyos nombres no describen por sí mismos el ensayo diagnóstico.
    return (tieneProductoDiagnostico && (compradorIVD || fuenteIVD)) || (compradorIVD && fuenteIVD);
  }

  function sumar_(puntos, evidencia, categoria, terminos, peso, etiqueta) {
    if (!terminos.length) return;
    puntos[categoria] += terminos.length * peso;
    evidencia.push(etiqueta + ' ' + categoria + ': ' + terminos.join(', ') + ' +' + (terminos.length * peso));
  }

  function agregar_(puntos, evidencia, categoria, valor, texto) {
    puntos[categoria] += valor;
    evidencia.push(texto + ' +' + valor);
  }

  function detalle_(resultado, puntos, evidencia) {
    return { resultado: resultado, puntajes: puntos, evidencia: evidencia };
  }

  function normalizar_(valor) {
    return String(valor == null ? '' : valor).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapar_(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function obtenerHojaDestino_() {
    const hoja = SpreadsheetApp.openById(C.idDestino).getSheetByName(C.hojaDestino);
    if (!hoja) throw new Error('No se encontró la hoja destino 2025.');
    return hoja;
  }

  function leerConteos_() {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty(C.propiedades.conteos) || '{"IVD":0,"NO ES IVD":0,"PHARMA":0}');
  }

  function programarContinuacion_() {
    borrarTriggers_();
    ScriptApp.newTrigger('continuarClasificacionIVDPorPatrones2025').timeBased().after(C.esperaMinutos * 60000).create();
  }

  function borrarTriggers_() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'continuarClasificacionIVDPorPatrones2025') ScriptApp.deleteTrigger(trigger);
    });
  }

  function finalizar_() {
    const conteos = leerConteos_();
    borrarTriggers_();
    const props = PropertiesService.getScriptProperties();
    Object.keys(C.propiedades).forEach(function(clave) { props.deleteProperty(C.propiedades[clave]); });
    Logger.log(C.prefijo + ' Finalizado. | ' + JSON.stringify(conteos));
    return conteos;
  }

  return { iniciar: iniciar, continuar: continuar, diagnosticar: diagnosticar };
})();
