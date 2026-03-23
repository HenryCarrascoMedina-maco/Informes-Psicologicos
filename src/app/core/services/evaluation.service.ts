import { Injectable, signal, computed } from '@angular/core';
import { AnyExamen, NivelInfo, NivelClinico } from '../models/evaluation.model';
import { EXAMENES_MOCK } from '../../data/examenes.mock';

@Injectable({ providedIn: 'root' })
export class EvaluationService {

  private readonly _examenes = signal<AnyExamen[]>(EXAMENES_MOCK);
  private readonly _selectedId = signal<string>(EXAMENES_MOCK[0].id);

  readonly examenes = this._examenes.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();

  readonly selectedExamen = computed<AnyExamen | null>(() => {
    const id = this._selectedId();
    return this._examenes().find(e => e.id === id) ?? null;
  });

  selectExamen(id: string): void {
    this._selectedId.set(id);
  }

  getNivelInfo(pct: number): NivelInfo {
    if (pct >= 85) return { label: 'Desarrollo alto',          emoji: '', text: 'Desarrollo alto',          cls: 'nivel-adecuado',      color: '#16a34a' };
    if (pct >= 70) return { label: 'Desarrollo promedio',      emoji: '', text: 'Desarrollo promedio',      cls: 'nivel-leve',          color: '#ca8a04' };
    if (pct >= 50) return { label: 'Desarrollo promedio bajo', emoji: '', text: 'Desarrollo promedio bajo', cls: 'nivel-moderado',      color: '#ea580c' };
    return            { label: 'Desarrollo bajo',              emoji: '', text: 'Desarrollo bajo',          cls: 'nivel-significativo', color: '#dc2626' };
  }

  getNivelClinico(pct: number): NivelClinico {
    if (pct >= 85) return 'adecuado';
    if (pct >= 70) return 'leve';
    if (pct >= 50) return 'moderado';
    return 'significativo';
  }
}
