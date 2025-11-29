import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { StandupService, Standup } from '../standup.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    completionRate: 100,
    teamMembers: 0
  };

  // New Metrics
  sprint: any = null;
  burnupData: any[] = [];
  risk: any = null;
  velocityData: any[] = [];

  // Chart Helpers
  maxBurnupPoints = 100;
  burnupPath = '';
  velocityMax = 0;
  velocityChange = 0;
  
  aiTip = '';
  isTipLoading = false;

  ngOnInit() {
    this.loadData();
    this.loadTeamCount();
    this.loadSprintMetrics();

    this.loadAiTip();
  }

  loadAiTip() {
    this.isTipLoading = true;
    this.standupService.sendChatMessage('Give me a short, inspiring agile tip for the team.').subscribe({
      next: (res) => {
        this.aiTip = res.response;
        this.isTipLoading = false;
      },
      error: () => {
        this.aiTip = 'Keep communication open and frequent!';
        this.isTipLoading = false;
      }
    });
  }

  loadSprintMetrics() {
    this.standupService.getSprintCurrent().subscribe({
      next: (res) => this.sprint = res,
      error: (err) => console.error('Sprint fetch failed', err)
    });

    this.standupService.getSprintBurnup().subscribe({
      next: (res) => {
        this.burnupData = res;
        this.calculateBurnupPath();
      },
      error: (err) => console.error('Burnup fetch failed', err)
    });

    this.standupService.getSprintRisk().subscribe({
      next: (res) => this.risk = res,
      error: (err) => console.error('Risk fetch failed', err)
    });

    this.standupService.getSprintVelocity().subscribe({
      next: (res) => {
        this.velocityData = res;
        this.velocityMax = Math.max(...res.map((v: any) => v.points_completed), 10);

        // Calculate change vs previous
        if (this.velocityData.length >= 2) {
          const current = this.velocityData[this.velocityData.length - 1].points_completed;
          const previous = this.velocityData[this.velocityData.length - 2].points_completed;
          if (previous > 0) {
            this.velocityChange = Math.round(((current - previous) / previous) * 100);
          }
        }
      },
      error: (err) => console.error('Velocity fetch failed', err)
    });
  }

  calculateBurnupPath() {
    if (!this.burnupData.length) return;

    // Simple SVG path calculation
    // Assuming 100% width and height for the chart area
    // X axis: date (index), Y axis: points

    const width = 100;
    const height = 100;
    this.maxBurnupPoints = Math.max(...this.burnupData.map(d => d.total_points), 100);

    const points = this.burnupData.map((d, i) => {
      const x = (i / (this.burnupData.length - 1)) * width;
      const y = height - ((d.completed_points / this.maxBurnupPoints) * height);
      return `${x},${y}`;
    });

    this.burnupPath = `M ${points.join(' L ')}`;
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
