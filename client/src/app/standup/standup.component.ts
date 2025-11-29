import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StandupService } from '../standup.service';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-standup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './standup.component.html'
})
export class StandupComponent implements OnInit {
  standupService = inject(StandupService);
  authService = inject(AuthService);

  updates: any[] = [];
  summary: string = ''; // Editable summary
  isLoading = false;
  isPosting = false;

  // Input Form Data
  formData = {
    yesterday: '',
    today: '',
    blockers: ''
  };
  isSubmitting = false;

  ngOnInit() {
    this.loadUpdates();
  }

  async loadUpdates() {
    this.updates = await firstValueFrom(this.standupService.getStandups());
  }

  async submitStandup() {
    if (!this.formData.yesterday || !this.formData.today) return;

    this.isSubmitting = true;
    try {
      await firstValueFrom(this.standupService.postStandup(this.formData));
      this.formData = { yesterday: '', today: '', blockers: '' }; // Reset
      await this.loadUpdates(); // Refresh feed
    } catch (err) {
      console.error(err);
      alert('Failed to submit update');
    } finally {
      this.isSubmitting = false;
    }
  }

  async generateSummary() {
    this.isLoading = true;
    try {
      const result = await firstValueFrom(this.standupService.generateSummary(new Date().toISOString().split('T')[0]));
      this.summary = result.summary;
    } catch (error) {
      console.error('Failed to generate summary', error);
    } finally {
      this.isLoading = false;
    }
  }

  postToSlack() {
    this.isPosting = true;
    // Mock Slack Post
    setTimeout(() => {
      alert(`Posted summary to Slack channel #daily-standup!`);
      this.isPosting = false;
    }, 1000);
  }
}
