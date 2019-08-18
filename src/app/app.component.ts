import {Component, ViewChild, AfterViewInit, ElementRef} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '...',
      }),
    ],
    zoom: 14,
    center: L.latLng(40.7583757, -73.9736026),
  };
  layers = [L.circle([40.7583757, -73.9736026], {radius: 20, fillOpacity: 1})];

  constructor() {}
}
