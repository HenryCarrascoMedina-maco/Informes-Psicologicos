import {
  Component, inject, computed, signal, linkedSignal,
  ViewChild, ElementRef, effect, AfterViewInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { ExamenEvalua, AreaEvalua, isExamenEvalua } from '../../../../core/models/evaluation.model';

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

interface ComputedSubmodulo {
  num: number;
  nombre: string;
  max: number;
  sujeto: number;
  pct: number;
}

interface ComputedArea {
  cod: string;
  nombre: string;
  submodulos: ComputedSubmodulo[];
  totalMax: number;
  totalSujeto: number;
  pct: number;
  nivelInfo: { label: string; emoji: string; text: string; cls: string; color: string };
}

@Component({
  selector: 'app-informe-evalua',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './informe-evalua.component.html',
  styleUrl: './informe-evalua.component.scss'
})
export class InformeEvaluaComponent implements AfterViewInit {

  private readonly evalService = inject(EvaluationService);

  @ViewChild('documento')      documentoRef!: ElementRef<HTMLDivElement>;
  @ViewChild('motivoDiv')      motivoRef!:    ElementRef<HTMLDivElement>;
  @ViewChild('observRef')      observRef!:    ElementRef<HTMLDivElement>;
  @ViewChild('conclusionDiv')  conclusionRef!: ElementRef<HTMLDivElement>;
  @ViewChild('recoGenEl')      recoGenRef!:   ElementRef<HTMLUListElement>;
  @ViewChild('recoFamEl')      recoFamRef!:   ElementRef<HTMLUListElement>;
  @ViewChild('recoColEl')      recoColRef!:   ElementRef<HTMLUListElement>;

  examen = linkedSignal<ExamenEvalua | null>(() => {
    const ex = this.evalService.selectedExamen();
    return ex && isExamenEvalua(ex) ? structuredClone(ex) as ExamenEvalua : null;
  });

  computedAreas = computed((): ComputedArea[] => {
    const ex = this.examen();
    if (!ex) return [];
    return ex.areas.map(a => {
      const totalMax    = a.submodulos.reduce((s, sub) => s + sub.max, 0);
      const totalSujeto = a.submodulos.reduce((s, sub) => s + sub.sujeto, 0);
      const pct         = totalMax > 0 ? Math.min(100, Math.round((totalSujeto / totalMax) * 100)) : 0;
      return {
        cod: a.cod,
        nombre: a.nombre,
        totalMax,
        totalSujeto,
        pct,
        nivelInfo: this.evalService.getNivelInfo(pct),
        submodulos: a.submodulos.map(sub => ({
          ...sub,
          pct: sub.max > 0 ? Math.min(100, Math.round((sub.sujeto / sub.max) * 100)) : 0,
        })),
      };
    });
  });

  speechEdits = signal<Record<string, string>>({});

  conclusiones = computed((): string => {
    const areas = this.computedAreas();
    const ex    = this.examen();
    if (!ex || !areas.length)
      return 'Los resultados no presentan información suficiente para emitir conclusiones.';

    const nombre = ex.estudiante.includes(',')
      ? ex.estudiante.split(',')[1].trim().split(' ')[0]
      : ex.estudiante.split(' ')[0];

    if (!nombre)
      return 'Los resultados no presentan información suficiente para emitir conclusiones.';

    const withData = areas.filter(a => a.totalMax > 0);
    if (!withData.length)
      return 'Los resultados no presentan información suficiente para emitir conclusiones.';

    const alto: string[] = [], promedio: string[] = [], promBajo: string[] = [], bajo: string[] = [];
    withData.forEach(a => {
      const lbl = a.nombre.charAt(0).toLowerCase() + a.nombre.slice(1);
      if (a.pct >= 85)      alto.push(lbl);
      else if (a.pct >= 70) promedio.push(lbl);
      else if (a.pct >= 50) promBajo.push(lbl);
      else                  bajo.push(lbl);
    });

    const list = (a: string[]) =>
      a.length <= 1 ? (a[0] ?? '') :
      a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];

    const sentences: string[] = [];

    // Sentence 1: verde (desarrollo alto)
    if (alto.length)
      sentences.push(`Los resultados de la evaluación indican que ${nombre} ha logrado desarrollar sus ${list(alto)}.`);

    // Sentence 2: amarillo + naranja
    if (promedio.length || promBajo.length) {
      const hasIntro = sentences.length > 0;
      let s: string;
      if (promedio.length && promBajo.length)
        s = hasIntro
          ? `Así mismo, se encuentra en proceso de desarrollar sus ${list(promedio)}, con avances parciales en sus ${list(promBajo)}.`
          : `Los resultados indican que ${nombre} se encuentra en proceso de desarrollar sus ${list(promedio)}, con avances parciales en sus ${list(promBajo)}.`;
      else if (promedio.length)
        s = hasIntro
          ? `Así mismo, se encuentra en proceso de consolidar sus ${list(promedio)}.`
          : `Los resultados indican que ${nombre} se encuentra en proceso de consolidar sus ${list(promedio)}.`;
      else
        s = hasIntro
          ? `Así mismo, muestra avances parciales en sus ${list(promBajo)}.`
          : `Los resultados indican que ${nombre} muestra avances parciales en sus ${list(promBajo)}.`;
      sentences.push(s);
    }

    // Sentence 3: rojo (desarrollo bajo)
    if (bajo.length) {
      const s = sentences.length > 0
        ? `No obstante, presenta dificultades en sus ${list(bajo)}, por lo que se recomienda intervención de apoyo.`
        : `Los resultados evidencian que ${nombre} presenta dificultades en sus ${list(bajo)}, requiriendo intervención especializada.`;
      sentences.push(s);
    }

    return sentences.length
      ? sentences.join(' ')
      : 'Los resultados no presentan información suficiente para emitir conclusiones.';
  });

  conclusionEdit = signal<string>('');
  previewOpen    = signal(false);
  pdfGenerating  = signal(false);
  previewImages  = signal<string[]>([]);

  private prevExamId: string | null = null;

  constructor() {
    effect(() => {
      const ex = this.examen();
      if (!ex || ex.id === this.prevExamId) return;
      this.prevExamId = ex.id;
      this.speechEdits.set({});
      this.conclusionEdit.set('');
      this.setEditable(this.motivoRef,     ex.motivoEvaluacion);
      this.setEditable(this.observRef,     ex.observacionConducta);
      this.setEditable(this.conclusionRef, this.conclusiones());
      this.setList(this.recoGenRef, ex.recomendacionesGenerales);
      this.setList(this.recoFamRef, ex.recomendacionesFamilia);
      this.setList(this.recoColRef, ex.recomendacionesColegio);
    });
  }

  ngAfterViewInit(): void {
    const ex = this.examen();
    if (!ex) return;
    this.prevExamId = ex.id;
    this.setEditable(this.motivoRef,     ex.motivoEvaluacion);
    this.setEditable(this.observRef,     ex.observacionConducta);
    this.setEditable(this.conclusionRef, this.conclusiones());
    this.setList(this.recoGenRef, ex.recomendacionesGenerales);
    this.setList(this.recoFamRef, ex.recomendacionesFamilia);
    this.setList(this.recoColRef, ex.recomendacionesColegio);
  }

  private setEditable(ref: ElementRef | undefined, text: string): void {
    if (ref?.nativeElement) ref.nativeElement.innerText = text;
  }

  private setList(ref: ElementRef | undefined, items: string[]): void {
    if (!ref?.nativeElement) return;
    ref.nativeElement.innerHTML = items
      .map(i => `<li><span class="reco-bullet" contenteditable="false">&bull;&nbsp;</span>${this.esc(i)}</li>`)
      .join('');
  }

  private esc(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  getSpeechDisplay(index: number, area: ComputedArea): string {
    const edits = this.speechEdits();
    if (edits[area.cod]) return edits[area.cod];
    if (area.totalMax === 0)
      return `En el área de ${area.nombre}, aún no se registran datos de rendimiento.`;
    const templates = [
      `En el área de ${area.nombre}, el menor alcanzó un ${area.pct}% de rendimiento, indicando ${area.nivelInfo.text.toLowerCase()}.`,
      `El evaluado obtuvo en ${area.nombre} un porcentaje de rendimiento del ${area.pct}%, lo que refleja ${area.nivelInfo.text.toLowerCase()}.`,
      `Con respecto a ${area.nombre} (${area.pct}%), los resultados evidencian ${area.nivelInfo.text.toLowerCase()}.`,
      `En ${area.nombre}, se observó un rendimiento del ${area.pct}%, situándose en el nivel de ${area.nivelInfo.text.toLowerCase()}.`,
    ];
    return templates[index % templates.length];
  }

  onSpeechEdit(cod: string, value: string): void {
    this.speechEdits.update(e => ({ ...e, [cod]: value }));
  }

  getNivelInfo(pct: number) { return this.evalService.getNivelInfo(pct); }

  formatFecha(value: string): string {
    if (!value) return '';
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return value;
    return `${d} de ${MESES[m - 1]} del ${y}`;
  }

  calcEdad(value: string): string {
    if (!value) return '';
    const hoy = new Date();
    const nac = new Date(value + 'T12:00:00');
    let e = hoy.getFullYear() - nac.getFullYear();
    const dm = hoy.getMonth() - nac.getMonth();
    if (dm < 0 || (dm === 0 && hoy.getDate() < nac.getDate())) e--;
    return e >= 0 ? e + ' año' + (e !== 1 ? 's' : '') : '';
  }

  setField(field: keyof ExamenEvalua, value: unknown): void {
    const ex = this.examen();
    if (ex) this.examen.set({ ...ex, [field]: value });
  }

  onFechaNacChange(value: string): void {
    const ex = this.examen();
    if (!ex) return;
    const edad = this.calcEdad(value);
    this.examen.set({ ...ex, fechaNacimiento: value, ...(edad ? { edad } : {}) });
  }

  onSubScoreChange(areaIndex: number, subIndex: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) =>
        ai === areaIndex
          ? { ...a, submodulos: a.submodulos.map((s, si) =>
              si === subIndex ? { ...s, sujeto: Math.max(0, parseInt(value) || 0) } : s) }
          : a
      );
      return { ...ex, areas };
    });
  }

  onSubMaxChange(areaIndex: number, subIndex: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) =>
        ai === areaIndex
          ? { ...a, submodulos: a.submodulos.map((s, si) =>
              si === subIndex ? { ...s, max: Math.max(0, parseInt(value) || 0) } : s) }
          : a
      );
      return { ...ex, areas };
    });
  }

  onAreaNameChange(areaIndex: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) =>
        ai === areaIndex ? { ...a, nombre: value.trim() || a.nombre } : a
      );
      return { ...ex, areas };
    });
  }

  onSubNameChange(areaIndex: number, subIndex: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) =>
        ai === areaIndex
          ? { ...a, submodulos: a.submodulos.map((s, si) =>
              si === subIndex ? { ...s, nombre: value.trim() || s.nombre } : s) }
          : a
      );
      return { ...ex, areas };
    });
  }

  addArea(): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const cod = String.fromCharCode(65 + (ex.areas.length % 26));
      const newArea: AreaEvalua = {
        cod,
        nombre: 'Nueva Área',
        submodulos: [{ num: 1, nombre: 'Subárea 1', max: 0, sujeto: 0 }],
      };
      return { ...ex, areas: [...ex.areas, newArea] };
    });
  }

  addSubmodulo(areaIndex: number): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) => {
        if (ai !== areaIndex) return a;
        const nextNum = (a.submodulos[a.submodulos.length - 1]?.num ?? 0) + 1;
        return { ...a, submodulos: [...a.submodulos, { num: nextNum, nombre: 'Nueva subárea', max: 0, sujeto: 0 }] };
      });
      return { ...ex, areas };
    });
  }

  removeArea(areaIndex: number): void {
    this.examen.update(ex =>
      ex ? { ...ex, areas: ex.areas.filter((_, i) => i !== areaIndex) } : null
    );
  }

  removeSubmodulo(areaIndex: number, subIndex: number): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const areas = ex.areas.map((a, ai) =>
        ai === areaIndex
          ? { ...a, submodulos: a.submodulos.filter((_, si) => si !== subIndex) }
          : a
      );
      return { ...ex, areas };
    });
  }

  onMotivoBlur(el: HTMLElement): void {
    this.examen.update(ex => ex ? { ...ex, motivoEvaluacion: el.innerText.trim() } : null);
  }

  onObservacionBlur(el: HTMLElement): void {
    this.examen.update(ex => ex ? { ...ex, observacionConducta: el.innerText.trim() } : null);
  }

  onConclusionBlur(el: HTMLElement): void {
    this.conclusionEdit.set(el.innerText.trim());
  }

  onRecoKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    let node: Node | null = range.startContainer;
    while (node && node.nodeName !== 'LI') node = node.parentNode;
    const currentLi = node as HTMLLIElement | null;
    const ul = currentLi?.parentElement;
    if (!ul || !currentLi) return;
    const newLi = document.createElement('li');
    const bullet = document.createElement('span');
    bullet.className = 'reco-bullet';
    bullet.setAttribute('contenteditable', 'false');
    bullet.innerHTML = '&bull;&nbsp;';
    newLi.appendChild(bullet);
    currentLi.after(newLi);
    const newRange = document.createRange();
    newRange.setStartAfter(bullet);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  showPicker(inputEl: HTMLInputElement): void {
    try { inputEl.showPicker(); } catch { inputEl.click(); }
  }

  async openPreview(): Promise<void> {
    const urls = await this.renderPages(false);
    this.previewImages.set(urls.map(p => p.dataUrl));
    this.previewOpen.set(true);
  }

  async downloadPdf(): Promise<void> {
    this.pdfGenerating.set(true);
    try {
      const [jsPDFMod, pages] = await Promise.all([
        import('jspdf'),
        this.renderPages(true),
      ]);
      const { jsPDF } = jsPDFMod;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const AW = 210, AH = 297;
      pages.forEach(({ dataUrl, w, h }, i) => {
        const ih = Math.min((h / w) * AW, AH);
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', 0, 0, AW, ih);
      });
      pdf.save(`Informe-${this.examen()?.estudiante || 'Informe'}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      this.pdfGenerating.set(false);
    }
  }

  private async renderPages(hq: boolean): Promise<{ dataUrl: string; w: number; h: number }[]> {
    const doc = this.documentoRef?.nativeElement;
    if (!doc) return [];

    const nombre = (this.examen()?.estudiante ?? '').toUpperCase();
    const clone  = this.cloneForPdf(doc);

    const pages: HTMLElement[][] = [[], [], []];
    let pi = 0;
    Array.from(clone.children).forEach(child => {
      const el = child as HTMLElement;
      if (el.id === 'sec-resultados')   pi = 1;
      if (el.id === 'sec-conclusiones') pi = 2;
      pages[pi].push(el);
    });

    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-999;width:794px;background:#f0f4f8;font-family:Segoe UI,Arial,sans-serif;font-size:0.92rem;color:#222;';
    host.style.setProperty('--azul',       '#1a4a7a');
    host.style.setProperty('--azul-med',   '#2563a8');
    host.style.setProperty('--azul-claro', '#e8f1fb');
    host.style.setProperty('--gris',       '#5a6478');
    host.style.setProperty('--linea',      '#c8d6e8');

    const cards: HTMLElement[] = [];
    pages.forEach((children, i) => {
      if (!children.length) return;
      const card = document.createElement('div');
      card.style.cssText = 'width:794px;background:#fff;padding:1.3cm 1.4cm;position:relative;box-sizing:border-box;';
      card.style.setProperty('--azul',       '#1a4a7a');
      card.style.setProperty('--azul-med',   '#2563a8');
      card.style.setProperty('--azul-claro', '#e8f1fb');
      card.style.setProperty('--gris',       '#5a6478');
      card.style.setProperty('--linea',      '#c8d6e8');
      if (nombre) {
        const nd = document.createElement('div');
        nd.style.cssText = 'position:absolute;top:.5cm;right:1.4cm;font-size:.92rem;font-weight:700;color:#555;letter-spacing:.05em;text-transform:uppercase;';
        nd.textContent = nombre;
        card.appendChild(nd);
        const sp = document.createElement('div');
        sp.style.height = '.2cm';
        card.appendChild(sp);
      }
      children.forEach(el => card.appendChild(el));
      const foot = document.createElement('div');
      foot.style.cssText = 'text-align:center;font-size:.65rem;color:#bbb;margin-top:.8rem;border-top:1px solid #f2f2f2;padding-top:.3rem;';
      foot.textContent = `— Página ${i + 1} de 3 —`;
      card.appendChild(foot);
      cards.push(card);
      host.appendChild(card);
    });

    document.body.appendChild(host);
    await new Promise(r => setTimeout(r, 300));

    const h2c = (await import('html2canvas')).default;
    const results: { dataUrl: string; w: number; h: number }[] = [];
    for (const card of cards) {
      const canvas = await h2c(card, {
        scale: hq ? 2 : 1.2, useCORS: true, backgroundColor: '#ffffff',
        width: 794, windowWidth: 794,
      });
      results.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.97), w: canvas.width, h: canvas.height });
    }

    document.body.removeChild(host);
    return results;
  }

  private cloneForPdf(original: HTMLElement): HTMLElement {
    const clone = original.cloneNode(true) as HTMLElement;

    // Inline tabla-evalua header styles
    clone.querySelectorAll<HTMLElement>('.tabla-evalua thead th').forEach(th => {
      th.style.background    = '#1a4a7a';
      th.style.color         = '#fff';
      th.style.padding       = '.55rem .5rem';
      th.style.fontSize      = '.82rem';
      th.style.fontWeight    = '700';
      th.style.textAlign     = 'center';
      th.style.border        = '1px solid rgba(255,255,255,.15)';
      th.style.verticalAlign = 'middle';
    });

    // Inline area row styles
    clone.querySelectorAll<HTMLElement>('.tr-area td').forEach(td => {
      td.style.background    = '#e8f1fb';
      td.style.fontWeight    = '700';
      td.style.padding       = '.5rem .5rem';
      td.style.border        = '1px solid #c8d6e8';
      td.style.fontSize      = '.88rem';
      td.style.verticalAlign = 'middle';
      td.style.textAlign     = 'center';
    });

    // Area name column left-aligned
    clone.querySelectorAll<HTMLElement>('.td-area-nombre').forEach(td => {
      td.style.textAlign = 'left';
    });

    // Inline submodule row styles
    clone.querySelectorAll<HTMLElement>('.tr-sub td').forEach(td => {
      td.style.padding       = '.38rem .5rem';
      td.style.border        = '1px solid #e8e8e8';
      td.style.fontSize      = '.82rem';
      td.style.color         = '#444';
      td.style.verticalAlign = 'middle';
      td.style.textAlign     = 'center';
    });

    clone.querySelectorAll<HTMLElement>('.td-sub-nombre').forEach(td => {
      td.style.textAlign   = 'left';
      td.style.paddingLeft = '1.8rem';
    });

    // Copy live input/textarea values
    const origIns  = Array.from(original.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea'));
    const cloneIns = Array.from(clone.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea'));
    origIns.forEach((el, i) => { if (cloneIns[i]) cloneIns[i].value = el.value; });

    // Convert narrativa-linea → plain "• text" paragraphs
    clone.querySelectorAll<HTMLElement>('.narrativa-linea').forEach(lineDiv => {
      const ta = lineDiv.querySelector<HTMLTextAreaElement>('textarea');
      const p  = document.createElement('p');
      p.style.cssText = 'margin:0 0 .45rem;text-align:justify;line-height:1.55;';
      p.textContent   = '\u2022 ' + (ta?.value ?? '');
      lineDiv.replaceWith(p);
    });

    // Replace remaining inputs with spans
    clone.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
      if (inp.type === 'date') { inp.remove(); return; }
      const s = document.createElement('span');
      s.textContent = inp.value;
      if (inp.classList.contains('input-puntaje')) s.style.fontWeight = '700';
      inp.replaceWith(s);
    });

    // Replace remaining textareas
    clone.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(ta => {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;text-align:justify;line-height:1.55;white-space:pre-wrap;';
      p.textContent = ta.value;
      ta.replaceWith(p);
    });

    // Convert recommendation lists to bullet-prefixed lists
    clone.querySelectorAll<HTMLUListElement>('.lista-reco').forEach(ul => {
      ul.querySelectorAll('li').forEach(li => {
        li.style.cssText = 'position:relative;padding-left:1.3em;margin-bottom:.5rem;line-height:1.6;list-style:none;';
        li.querySelectorAll('.reco-bullet').forEach(el => el.remove());
        const dot = document.createElement('span');
        dot.style.cssText = 'position:absolute;left:0;color:#2563a8;font-weight:700;';
        dot.textContent = '\u2022';
        li.insertBefore(dot, li.firstChild);
      });
      ul.style.paddingLeft = '0';
      ul.style.listStyle   = 'none';
    });

    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.fecha-display').forEach((el: Element) => (el as HTMLElement).style.borderBottom = 'none');
    clone.querySelectorAll('.edit-hint,.no-pdf').forEach(el => el.remove());
    clone.querySelectorAll('.escala-card').forEach(el => el.remove());
    clone.querySelectorAll('.nombre-header-meta').forEach(el => el.remove());
    return clone;
  }
}
