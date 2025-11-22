import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from '../standup.service';

@Component({
  selector: 'app-standup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './standup.component.html',
})
export class StandupComponent implements OnInit {
  standups: Standup[] = [];
  filteredStandups: Standup[] = [];
  summary = '';
  isLoading = false;
  selectedDate: string = '';

  // Form Inputs - REMOVED for Read-Only View

  private standupService = inject(StandupService);

  ngOnInit() {
    this.setToday();
    this.loadData();
  }

  loadData() {
    this.standupService.getStandups().subscribe((data) => {
      this.standups = data;
      this.filterByDate();
    });
  }

  setToday() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.filterByDate();
  }

  isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.selectedDate === today;
  }

  onDateChange() {
    this.filterByDate();
  }

  filterByDate() {
    if (!this.selectedDate) return;

    this.filteredStandups = this.standups.filter((standup) => {
      if (!standup.created_at) return false;
      const standupDate = new Date(standup.created_at).toISOString().split('T')[0];
      return standupDate === this.selectedDate;
    });
  }

  getAiSummary() {
    this.isLoading = true;
    this.standupService.generateSummary().subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.summary =
          '⚠️ Failed to generate summary. Check backend console for details.';
        this.isLoading = false;
      },
    });
  }
}
