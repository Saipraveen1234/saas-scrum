import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StandupService } from '../standup.service';

@Component({
    selector: 'app-backlog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './backlog.component.html',
})
export class BacklogComponent implements OnInit {
    tasks: any[] = [];
    isLoading = false;
    private standupService = inject(StandupService);

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        this.isLoading = true;
        this.standupService.getBacklog().subscribe({
            next: (data) => {
                this.tasks = data.map(t => ({ ...t, isGrooming: false, suggestion: null }));
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    groom(task: any) {
        task.isGrooming = true;
        this.standupService.groomTask(task).subscribe({
            next: (suggestion) => {
                task.suggestion = suggestion;
                task.isGrooming = false;
            },
            error: (err) => {
                console.error(err);
                task.isGrooming = false;
                alert('Failed to groom task. Check console.');
            }
        });
    }
}
