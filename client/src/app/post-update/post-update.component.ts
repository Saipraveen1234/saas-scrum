import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StandupService, Standup } from '../standup.service';

@Component({
  selector: 'app-post-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-update.component.html',
})
export class PostUpdateComponent {
  user_name = '';
  yesterday = '';
  today = '';
  blockers = '';
  isSubmitting = false;
  showSuccess = false;

  private standupService = inject(StandupService);
  private router = inject(Router);

  submit() {
    if (!this.user_name || !this.yesterday || !this.today) {
      alert('Please fill in all required fields (Name, Yesterday, Today)');
      return;
    }

    this.isSubmitting = true;

    const newEntry: Partial<Standup> = {
      user_name: this.user_name,
      yesterday: this.yesterday,
      today: this.today,
      blockers: this.blockers || 'None',
    };

    this.standupService.postStandup(newEntry).subscribe({
      next: () => {
        this.showSuccess = true;
        this.isSubmitting = false;

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        console.error(err);
        alert('Failed to post update. Please try again.');
        this.isSubmitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
