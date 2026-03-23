export interface ResultadoArea {
  cod: string;
  area: string;
  max: number;
  sujeto: number;
  pct?: number;
  nivel?: NivelClinico;
  speechEdit?: string;
}

export type NivelClinico =
  | 'adecuado'
  | 'leve'
  | 'moderado'
  | 'significativo';

export interface NivelInfo {
  label: string;
  emoji: string;
  text: string;
  cls: string;
  color: string;
}

export interface Examen {
  id: string;
  tipo?: 'conductual';
  titulo: string;
  area: string;
  institucion: string;
  especialista: string;
  licencia: string;
  // Filiación
  estudiante: string;
  edad: string;
  fechaNacimiento: string;   // YYYY-MM-DD
  escolaridad: string;
  fechaInforme: string;      // YYYY-MM-DD
  // Contenido
  motivoEvaluacion: string;
  observacionConducta: string;
  instrumentos: string[];
  resultados: ResultadoArea[];
  recomendacionesGenerales: string[];
  recomendacionesFamilia: string[];
  recomendacionesColegio: string[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  examenId: string;
}

// ── Evalua types ────────────────────────────────────────────────────────────
export interface SubmoduloEvalua {
  num: number;
  nombre: string;
  max: number;
  sujeto: number;
}

export interface AreaEvalua {
  cod: string;
  nombre: string;
  submodulos: SubmoduloEvalua[];
}

export interface ExamenEvalua {
  id: string;
  tipo: 'evalua';
  titulo: string;
  area: string;
  institucion: string;
  especialista: string;
  licencia: string;
  estudiante: string;
  edad: string;
  fechaNacimiento: string;
  escolaridad: string;
  fechaInforme: string;
  motivoEvaluacion: string;
  observacionConducta: string;
  instrumentos: string[];
  areas: AreaEvalua[];
  recomendacionesGenerales: string[];
  recomendacionesFamilia: string[];
  recomendacionesColegio: string[];
}

export type AnyExamen = Examen | ExamenEvalua;

export function isExamenEvalua(ex: AnyExamen | null | undefined): ex is ExamenEvalua {
  return !!ex && (ex as ExamenEvalua).tipo === 'evalua';
}
