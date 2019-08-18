import {Component} from '@angular/core';
import * as L from 'leaflet';
import {StationInformation} from '../station_information';

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
  layers = [] as L.Circle[];

  constructor() {
    this.fetchStations();
  }

  async fetchStations() {
    const response = await fetch('/assets/station_information.json');
    const json = await response.text();
    const info = JSON.parse(json) as StationInformation;
    const options = {radius: 20, fillOpacity: 1};
    this.layers = info.data.stations.map(station => L.circle([station.lat, station.lon], options));
  }
}
