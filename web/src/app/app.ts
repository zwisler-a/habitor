import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { AppIdentity } from '@habitor/shared-types';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('web');
  protected readonly identity: AppIdentity = {
    name: 'habitor-web',
    version: '0.1.0',
  };
}
