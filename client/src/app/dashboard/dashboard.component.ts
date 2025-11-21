import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from '../standup.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  standups: Standup[] = [];
  recentUpdates: Standup[] = [];
  summary = '';
  isLoading = false;
  selectedDate: string = '';

  todayStats = {
    totalUpdates: 0,
    teamMembers: 0,
    blockers: 0,
    completionRate: 100,
  };

  private standupService = inject(StandupService);

  ngOnInit() {
    this.setToday();
    this.loadData();
  }

  loadData() {
    this.standupService.getStandups().subscribe((data) => {
      this.standups = data;
      this.filterByDate();
      this.calculateStats();
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
    this.calculateStats();
  }

  filterByDate() {
    if (!this.selectedDate) return;

    this.recentUpdates = this.standups
      .filter((standup) => {
        if (!standup.created_at) return false;
        const standupDate = new Date(standup.created_at).toISOString().split('T')[0];
        return standupDate === this.selectedDate;
      })
      .slice(0, 10);
  }

  calculateStats() {
    const todayUpdates = this.recentUpdates;
    this.todayStats.totalUpdates = todayUpdates.length;

    const uniqueMembers = new Set(todayUpdates.map(u => u.user_name));
    this.todayStats.teamMembers = uniqueMembers.size;

    this.todayStats.blockers = todayUpdates.filter(
      u => u.blockers && u.blockers !== 'None'
    ).length;

    this.todayStats.completionRate = todayUpdates.length > 0
      ? Math.round(((todayUpdates.length - this.todayStats.blockers) / todayUpdates.length) * 100)
      : 100;
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
        this.summary = 'Failed to generate summary. Please try again.';
        this.isLoading = false;
      },
    });
  }
}
