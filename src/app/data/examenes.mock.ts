import { AnyExamen } from '../core/models/evaluation.model';

const BASE_CONDUCTUAL = {
  area: 'Área Conductual',
  institucion: 'Colegio Personalizado Laurent Clerc',
  especialista: 'Lic. Gianella Ortiz Esteban',
  licencia: 'C.Ps.P. 67550',
  estudiante: 'SALDAÑA VARAS, Dominic',
  edad: '09 años',
  fechaNacimiento: '2015-04-28',
  escolaridad: 'Primaria',
  fechaInforme: new Date().toISOString().slice(0, 10),
  motivoEvaluacion:
    'Evaluación de inicio de año en el área conductual, realizada como parte del protocolo institucional del colegio, con el objetivo de evaluar el comportamiento del menor en el entorno escolar, identificar posibles necesidades y establecer estrategias para favorecer su adaptación y desarrollo socioemocional.',
  observacionConducta:
    'Dominic al inicio mostró predisposición para la evaluación, no obstante, la complejidad de las actividades hizo que el menor presente dificultades para seguir instrucciones, evidenciando una actitud de oposición ante las consignas. En varios momentos, adoptó conductas de evitación, especialmente cuando se le solicitaba realizar tareas que requerían mayor esfuerzo o atención. Sin embargo, logró completar algunas consignas, principalmente aquellas que estaban dentro de sus capacidades o que resultaban más prácticas de ejecutar. El menor es de contextura delgada, estatura acorde a su edad cronológica y presenta un buen aliño personal.',
  instrumentos: [
    'Observación de conducta',
    'Lista de Chequeo Conductual de Syracuse N/Y',
  ],
  resultados: [
    { cod: 'A', area: 'Habilidades Motoras',          max: 54, sujeto: 40 },
    { cod: 'B', area: 'Habilidades de Autocuidado',   max: 52, sujeto: 30 },
    { cod: 'C', area: 'Seguimiento de Instrucciones', max: 52, sujeto: 14 },
    { cod: 'D', area: 'Habilidades Académicas',       max: 74, sujeto: 40 },
    { cod: 'E', area: 'Habilidades Manipulativas',    max: 58, sujeto: 45 },
    { cod: 'F', area: 'Habilidades de Comunicación',  max: 60, sujeto: 30 },
    { cod: 'G', area: 'Habilidades Sociales',         max: 56, sujeto: 17 },
  ],
  recomendacionesGenerales: [
    'Terapia de Modificación de Conducta',
    'Terapia de Lenguaje (Habilidades comunicativas)',
  ],
  recomendacionesFamilia: [
    'Establecer rutinas diarias que brinden estructura y seguridad al menor, favoreciendo su adaptación.',
    'Reforzar de manera positiva los comportamientos adecuados mediante elogios, incentivos o recompensas.',
    'Dar instrucciones claras, simples y concretas, asegurándose de que el menor las comprenda antes de realizar una tarea.',
    'Fomentar la paciencia y persistencia, motivándolo a completar actividades con apoyo progresivo para reducir la frustración.',
    'Mantener una comunicación constante con los especialistas y aplicar en casa las estrategias recomendadas en terapia para reforzar los avances del menor.',
  ],
  recomendacionesColegio: [
    'Establecer rutinas estructuradas y predecibles en el aula para brindar seguridad y favorecer la regulación del niño.',
    'Utilizar instrucciones claras, breves y apoyadas con apoyos visuales si es necesario para facilitar la comprensión.',
    'Implementar refuerzo positivo para motivar y reforzar conductas adecuadas dentro del entorno escolar.',
    'Ofrecer pausas o ajustes en la carga de trabajo cuando las actividades demanden un esfuerzo elevado, evitando la frustración.',
  ],
};

export const EXAMENES_MOCK: AnyExamen[] = [
  {
    id: 'conductual-2026',
    titulo: 'Informe Syracusa',
    ...BASE_CONDUCTUAL,
  },
  {
    id: 'evalua-0',
    tipo: 'evalua' as const,
    titulo: 'Informe Evalua 0',
    area: 'Área Cognitiva y de Adaptación',
    institucion: 'Colegio Personalizado Laurent Clerc',
    especialista: 'Lic. Gianella Ortiz Esteban',
    licencia: 'C.Ps.P. 67550',
    estudiante: '',
    edad: '',
    fechaNacimiento: '',
    escolaridad: '',
    fechaInforme: new Date().toISOString().slice(0, 10),
    motivoEvaluacion: '',
    observacionConducta: '',
    instrumentos: [
      'Batería de Evaluación EVALUA',
      'Observación de conducta',
    ],
    areas: [
      {
        cod: 'A',
        nombre: 'Capacidades Cognitivas',
        submodulos: [
          { num: 1, nombre: 'Clasificación',                    max: 0, sujeto: 0 },
          { num: 2, nombre: 'Series',                           max: 0, sujeto: 0 },
          { num: 3, nombre: 'Organización Perceptiva (Puzzle)', max: 0, sujeto: 0 },
          { num: 4, nombre: 'Letras y Números',                 max: 0, sujeto: 0 },
          { num: 5, nombre: 'Memoria Verbal',                   max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'B',
        nombre: 'Capacidades Espaciales',
        submodulos: [
          { num: 1, nombre: 'Copia de dibujos',  max: 0, sujeto: 0 },
          { num: 2, nombre: 'Grafomotricidad',   max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'C',
        nombre: 'Capacidades Lingüísticas',
        submodulos: [
          { num: 1, nombre: 'Palabras y Frases',                     max: 0, sujeto: 0 },
          { num: 2, nombre: 'Recepción Auditiva y Articulación',     max: 0, sujeto: 0 },
          { num: 3, nombre: 'Habilidades Fonológicas',               max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'D',
        nombre: 'Habilidades de Adaptación',
        submodulos: [
          { num: 1, nombre: 'Test de la Familia', max: 0, sujeto: 0 },
          { num: 2, nombre: 'Test Palográfico',   max: 0, sujeto: 0 },
        ],
      },
    ],
    recomendacionesGenerales: [],
    recomendacionesFamilia:   [],
    recomendacionesColegio:   [],
  },
  {
    id: 'evalua-1',
    tipo: 'evalua' as const,
    titulo: 'Informe Evalua 1',
    area: 'Área Cognitiva y de Adaptación',
    institucion: 'Colegio Personalizado Laurent Clerc',
    especialista: 'Lic. Gianella Ortiz Esteban',
    licencia: 'C.Ps.P. 67550',
    estudiante: '',
    edad: '',
    fechaNacimiento: '',
    escolaridad: '',
    fechaInforme: new Date().toISOString().slice(0, 10),
    motivoEvaluacion: '',
    observacionConducta: '',
    instrumentos: [
      'Batería de Evaluación EVALUA',
      'Observación de conducta',
    ],
    areas: [
      {
        cod: 'A',
        nombre: 'Capacidades Cognitivas',
        submodulos: [
          { num: 1, nombre: 'Clasificación',                    max: 0, sujeto: 0 },
          { num: 2, nombre: 'Series',                           max: 0, sujeto: 0 },
          { num: 3, nombre: 'Organización Perceptiva (Puzzle)', max: 0, sujeto: 0 },
          { num: 4, nombre: 'Letras y Números',                 max: 0, sujeto: 0 },
          { num: 5, nombre: 'Memoria Verbal',                   max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'B',
        nombre: 'Capacidades Espaciales',
        submodulos: [
          { num: 1, nombre: 'Copia de dibujos',  max: 0, sujeto: 0 },
          { num: 2, nombre: 'Grafomotricidad',   max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'C',
        nombre: 'Capacidades Lingüísticas',
        submodulos: [
          { num: 1, nombre: 'Palabras y Frases',                     max: 0, sujeto: 0 },
          { num: 2, nombre: 'Recepción Auditiva y Articulación',     max: 0, sujeto: 0 },
          { num: 3, nombre: 'Habilidades Fonológicas',               max: 0, sujeto: 0 },
        ],
      },
      {
        cod: 'D',
        nombre: 'Habilidades de Adaptación',
        submodulos: [
          { num: 1, nombre: 'Test de la Familia', max: 0, sujeto: 0 },
          { num: 2, nombre: 'Test Palográfico',   max: 0, sujeto: 0 },
        ],
      },
    ],
    recomendacionesGenerales: [],
    recomendacionesFamilia:   [],
    recomendacionesColegio:   [],
  },
];
