import { Component, inject, input, output } from '@angular/core';
import { EvaluationService } from '../../../core/services/evaluation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  closeMobile = output<void>();

  protected readonly evalService = inject(EvaluationService);

  selectExamen(id: string): void {
    this.evalService.selectExamen(id);
    this.closeMobile.emit();
  }
}
