import { Component, inject, signal } from '@angular/core';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { InformeEvaluacionComponent } from '../../components/informe/informe-evaluacion.component';
import { InformeEvaluaComponent } from '../../components/informe-evalua/informe-evalua.component';
import { EvaluationService } from '../../../../core/services/evaluation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [SidebarComponent, InformeEvaluacionComponent, InformeEvaluaComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  sidebarCollapsed = signal<boolean>(false);
  mobileSidebarOpen = signal<boolean>(false);

  protected readonly evalService = inject(EvaluationService);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
