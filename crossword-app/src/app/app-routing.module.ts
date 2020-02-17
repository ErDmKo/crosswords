import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CrosswordComponent } from './crossword/crossword.component';
import { MainMenuComponent } from './main-menu/main-menu.component';

const routes: Routes = [
    {
        path: '',
        component: MainMenuComponent,
    },
    {
        path: 'game',
        component: CrosswordComponent,
    },
    {
        path: 'game/:id',
        component: CrosswordComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
