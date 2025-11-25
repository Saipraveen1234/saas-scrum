import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StandupService } from '../standup.service';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  standupService = inject(StandupService);
  authService = inject(AuthService);

  standups: any[] = [];
  recentUpdates: any[] = [];
  summary: string = '';
  isLoading = false;
  selectedDate: string = new Date().toISOString().split('T')[0];

  userTeam: string | null = null;
  userRole: 'admin' | 'employee' | null = null;

  todayStats = {
    totalUpdates: 0,
    blockers: 0,
    completionRate: 0,
    teamMembers: 0
  };

  // Mock Data for New Widgets
  sprintStatus = {
    name: 'Sprint 23',
    goal: 'Implement User Authentication & Team Management',
    daysRemaining: 4,
    totalDays: 10,
    progress: 60
  };

  burndownData = [
    { day: 1, ideal: 100, actual: 100 },
    { day: 2, ideal: 90, actual: 95 },
    { day: 3, ideal: 80, actual: 85 },
    { day: 4, ideal: 70, actual: 72 },
    { day: 5, ideal: 60, actual: 55 },
    { day: 6, ideal: 50, actual: 45 }, // Current
    { day: 7, ideal: 40, actual: null },
    { day: 8, ideal: 30, actual: null },
    { day: 9, ideal: 20, actual: null },
    { day: 10, ideal: 10, actual: null }
  ];

  velocity = {
    current: 24,
    average: 22,
    trend: 'up' // 'up', 'down', 'stable'
  };

  activeBlockers = [
    { id: 1, description: 'Waiting for API Access', owner: 'Sarah', age: 2 },
    { id: 2, description: 'DB Schema conflict', owner: 'Mike', age: 1 }
  ];

  aiTips = [
    "Consider breaking down task #124 into smaller subtasks.",
    "Team velocity is trending up! Great job.",
    "Reminder: 3 days left in the sprint."
  ];

  ngOnInit() {
    this.loadData();
    this.loadTeamCount();

    this.authService.userTeam$.subscribe(team => this.userTeam = team);
    this.authService.userRole$.subscribe(role => this.userRole = role);
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

  escalateBlocker(blocker: any) {
    alert(`Escalated blocker: ${blocker.description}`);
  }
}
