import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PostUpdateComponent } from './post-update/post-update.component';
import { StandupComponent } from './standup/standup.component';
import { BacklogComponent } from './backlog/backlog.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'post', component: PostUpdateComponent },
    { path: 'feed', component: StandupComponent },
    { path: 'backlog', component: BacklogComponent },
    { path: '**', redirectTo: '' }
];
