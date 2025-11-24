import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from '../standup.service';
import { AuthService } from '../auth.service';

import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MarkdownPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  standups: Standup[] = [];
  recentUpdates: Standup[] = [];
  summary = '';
  isLoading = false;
  selectedDate: string = '';
  userRole: 'admin' | 'employee' | null = null;
  userTeam: string | null = null;

  todayStats = {
    totalUpdates: 0,
    teamMembers: 0,
    blockers: 0,
    completionRate: 100,
  };

  private standupService = inject(StandupService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.authService.userRole$.subscribe(role => {
      this.userRole = role;
    });
    this.authService.userTeam$.subscribe(team => {
      this.userTeam = team;
    });
    this.setToday();
    this.loadData();
    this.loadTeamCount();
  }

  loadTeamCount() {
    this.standupService.getTeamCount().subscribe({
      next: (res) => {
        this.todayStats.teamMembers = res.count;
      },
      error: (err) => console.error('Failed to load team count', err)
    });
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

    this.todayStats.totalUpdates = todayUpdates.length;

    this.todayStats.blockers = todayUpdates.filter(u => {
      if (!u.blockers) return false;
      const lower = u.blockers.trim().toLowerCase();
      const nonBlockers = ['none', 'no', 'nil', 'n/a', 'nothing', 'no blockers', 'no blocker', '-', ''];
      return !nonBlockers.includes(lower);
    }).length;

    this.todayStats.completionRate = todayUpdates.length > 0
      ? Math.round(((todayUpdates.length - this.todayStats.blockers) / todayUpdates.length) * 100)
      : 100;
  }

  getAiSummary() {
    this.isLoading = true;
    this.standupService.generateSummary(this.selectedDate).subscribe({
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
