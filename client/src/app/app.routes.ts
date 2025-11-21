import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PostUpdateComponent } from './post-update/post-update.component';
import { StandupComponent } from './standup/standup.component';
import { BacklogComponent } from './backlog/backlog.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'post', component: PostUpdateComponent, canActivate: [authGuard] },
    { path: 'feed', component: StandupComponent, canActivate: [authGuard] },
    { path: 'backlog', component: BacklogComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
