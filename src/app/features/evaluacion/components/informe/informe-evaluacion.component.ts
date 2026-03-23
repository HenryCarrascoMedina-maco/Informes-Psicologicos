import {
  Component, inject, computed, signal, linkedSignal,
  ViewChild, ElementRef, effect, AfterViewInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { Examen, isExamenEvalua } from '../../../../core/models/evaluation.model';
import { SPEECHES } from '../../../../data/speeches';

const MESES = ['enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'];

@Component({
  selector: 'app-informe-evaluacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './informe-evaluacion.component.html',
  styleUrl: './informe-evaluacion.component.scss'
})
export class InformeEvaluacionComponent implements AfterViewInit {

  private readonly evalService = inject(EvaluationService);

  @ViewChild('documento')       documentoRef!:  ElementRef<HTMLDivElement>;
  @ViewChild('motivoDiv')       motivoRef!:      ElementRef<HTMLDivElement>;
  @ViewChild('observacionDiv')  observRef!:      ElementRef<HTMLDivElement>;
  @ViewChild('conclusionDiv')   conclusionRef!:  ElementRef<HTMLDivElement>;
  @ViewChild('recoGenEl')       recoGenRef!:     ElementRef<HTMLUListElement>;
  @ViewChild('recoFamEl')       recoFamRef!:     ElementRef<HTMLUListElement>;
  @ViewChild('recoColEl')       recoColRef!:     ElementRef<HTMLUListElement>;

  examen = linkedSignal<Examen | null>(() => {
    const ex = this.evalService.selectedExamen();
    return ex && !isExamenEvalua(ex) ? structuredClone(ex) as Examen : null;
  });

  resultados = computed(() => {
    const ex = this.examen();
    if (!ex) return [];
    return ex.resultados.map(r => ({
      ...r,
      pct: r.max > 0 ? Math.min(100, Math.round((r.sujeto / r.max) * 100)) : 0,
    }));
  });

  narrativas = computed(() =>
    this.resultados().map((r, i) => ({
      ...r,
      speechDisplay: r.speechEdit ?? this.buildFullSpeech(i, r.area, r.pct, this.getSpeech(r.cod, r.pct)),
      nivelInfo: this.evalService.getNivelInfo(r.pct),
    }))
  );

  conclusiones = computed((): string => {
    const rows = this.resultados();
    const ex   = this.examen();
    if (!ex || !rows.length)
      return 'Los resultados no presentan información suficiente para emitir conclusiones.';

    const nombre = ex.estudiante.includes(',')
      ? ex.estudiante.split(',')[1].trim().split(' ')[0]
      : ex.estudiante.split(' ')[0];

    const alto: string[] = [], promedio: string[] = [], promBajo: string[] = [], bajo: string[] = [];
    rows.forEach(r => {
      if (!r.area) return;
      const lbl = r.area.charAt(0).toLowerCase() + r.area.slice(1);
      if (r.pct >= 85)      alto.push(lbl);
      else if (r.pct >= 70) promedio.push(lbl);
      else if (r.pct >= 50) promBajo.push(lbl);
      else                  bajo.push(lbl);
    });

    const list = (a: string[]) =>
      a.length <= 1 ? (a[0] ?? '') :
      a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];

    const sentences: string[] = [];

    // Sentence 1: verde (desarrollo alto)
    if (alto.length)
      sentences.push(`Los resultados de la evaluación indican que ${nombre} ha logrado desarrollar sus ${list(alto)}.`);

    // Sentence 2: amarillo + naranja (en proceso / avances parciales)
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

  getSpeech(cod: string, pct: number): string {
    const idx = pct >= 85 ? 0 : pct >= 70 ? 1 : pct >= 50 ? 2 : 3;
    return SPEECHES[cod]?.[idx] ?? '';
  }

  private buildFullSpeech(index: number, area: string, pct: number, base: string): string {
    if (!base) return base;
    const lc = base.charAt(0).toLowerCase() + base.slice(1);
    switch (index % 6) {
      case 0:
        return `En el área de ${area}, el menor alcanzó un ${pct}% de rendimiento. ${base}`;
      case 1:
        return `El evaluado obtuvo en ${area} un porcentaje de rendimiento del ${pct}%. ${base}`;
      case 2:
        return `Con respecto a ${area} (${pct}% de rendimiento), ${lc}`;
      case 3:
        return `En ${area}, se observó un rendimiento del ${pct}%. ${base}`;
      case 4:
        return `El menor obtuvo un ${pct}% en el área de ${area}. ${base}`;
      default:
        return `Respecto al área de ${area}, el porcentaje alcanzado fue del ${pct}%. ${base}`;
    }
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

  setField(field: keyof Examen, value: unknown): void {
    const ex = this.examen();
    if (ex) this.examen.set({ ...ex, [field]: value });
  }

  onFechaNacChange(value: string): void {
    const ex = this.examen();
    if (!ex) return;
    const edad = this.calcEdad(value);
    this.examen.set({ ...ex, fechaNacimiento: value, ...(edad ? { edad } : {}) });
  }

  onScoreChange(index: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const rs = [...ex.resultados];
      rs[index] = { ...rs[index], sujeto: Math.max(0, parseInt(value) || 0) };
      return { ...ex, resultados: rs };
    });
  }

  onMaxChange(index: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const rs = [...ex.resultados];
      rs[index] = { ...rs[index], max: Math.max(0, parseInt(value) || 0) };
      return { ...ex, resultados: rs };
    });
  }

  onAreaChange(index: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const rs = [...ex.resultados];
      rs[index] = { ...rs[index], area: value };
      return { ...ex, resultados: rs };
    });
  }

  addRow(): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const cod = String.fromCharCode(65 + (ex.resultados.length % 26));
      return { ...ex, resultados: [...ex.resultados, { cod, area: 'Nueva Área', max: 0, sujeto: 0 }] };
    });
  }

  removeRow(index: number): void {
    this.examen.update(ex =>
      ex ? { ...ex, resultados: ex.resultados.filter((_, i) => i !== index) } : null
    );
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

  onSpeechEdit(index: number, value: string): void {
    this.examen.update(ex => {
      if (!ex) return null;
      const rs = [...ex.resultados];
      rs[index] = { ...rs[index], speechEdit: value.trim() || undefined };
      return { ...ex, resultados: rs };
    });
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

    // Split pages at section markers
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
        // Add a small spacer below the name for all pages
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

    // Inline table header styles so html2canvas renders them correctly
    clone.querySelectorAll<HTMLElement>('.tabla-resultados thead th').forEach(th => {
      th.style.background    = '#1a4a7a';
      th.style.color         = '#fff';
      th.style.padding       = '.55rem .5rem';
      th.style.fontSize      = '.82rem';
      th.style.fontWeight    = '700';
      th.style.textAlign     = 'center';
      th.style.border        = '1px solid rgba(255,255,255,.15)';
      th.style.verticalAlign = 'middle';
    });

    // Copy live input/textarea values before any DOM manipulation
    const origIns  = Array.from(original.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea'));
    const cloneIns = Array.from(clone.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea'));
    origIns.forEach((el, i) => { if (cloneIns[i]) cloneIns[i].value = el.value; });

    // Convert narrativa-linea divs → plain "• text" paragraphs for PDF
    clone.querySelectorAll<HTMLElement>('.narrativa-linea').forEach(lineDiv => {
      const ta = lineDiv.querySelector<HTMLTextAreaElement>('textarea');
      const p  = document.createElement('p');
      p.style.cssText = 'margin:0 0 .45rem;text-align:justify;line-height:1.55;';
      p.textContent   = '\u2022 ' + (ta?.value ?? '');
      lineDiv.replaceWith(p);
    });

    // Replace remaining inputs with plain text spans
    clone.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
      if (inp.type === 'date') { inp.remove(); return; }
      const s = document.createElement('span');
      s.textContent = inp.value;
      if (inp.classList.contains('input-puntaje')) s.style.fontWeight = '700';
      inp.replaceWith(s);
    });

    // Replace remaining textareas with plain paragraphs
    clone.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(ta => {
      const p = document.createElement('p');
      p.style.cssText = 'margin:0;text-align:justify;line-height:1.55;white-space:pre-wrap;';
      p.textContent = ta.value;
      ta.replaceWith(p);
    });

    // Convert recommendation lists → bullet-prefixed plain list for PDF
    clone.querySelectorAll<HTMLUListElement>('.lista-reco').forEach(ul => {
      ul.querySelectorAll('li').forEach(li => {
        li.style.cssText = 'position:relative;padding-left:1.3em;margin-bottom:.5rem;line-height:1.6;list-style:none;';
        // Remove any injected reco-bullet spans first to avoid duplicates
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
    // Remove the inline nombre-header-meta; the rendering code adds it consistently on every page
    clone.querySelectorAll('.nombre-header-meta').forEach(el => el.remove());
    return clone;
  }
}

