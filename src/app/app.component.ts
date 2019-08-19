import {Component} from '@angular/core';
import {scale} from 'chroma-js';
import * as L from 'leaflet';
import {flatMap} from 'lodash';
import {StationData} from '../station_data';
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
        opacity: 0.6,
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
    const info = await this.fetchJson<StationInformation>('/assets/station_information.json');
    const data = await this.fetchJson<StationData>('/assets/data.json');

    const stationMap = new Map(info.data.stations.map(station => [station.station_id, station]));
    const latestStations = data[0].data;
    const joinedLatestStations = flatMap(latestStations, station => {
      const stationInfo = stationMap.get(station.station_id);
      if (stationInfo) {
        return [
          {
            ...station,
            lat: stationInfo.lat,
            lon: stationInfo.lon,
          },
        ];
      } else {
        return [];
      }
    });

    const colorScale = scale(['red', 'yellow', 'green']);

    this.layers = joinedLatestStations.map(station => {
      const l =
        station.num_bikes_available / (station.num_bikes_available + station.num_docks_available);
      const color = colorScale(l).hex();
      return L.circle([station.lat, station.lon], {
        radius: 40,
        fillOpacity: 1,
        fillColor: color,
        stroke: false,
      });
    });
  }

  private async fetchJson<T>(url: string) {
    const stationsResponse = await fetch(url);
    const stationsJson = await stationsResponse.text();
    const info = JSON.parse(stationsJson) as T;
    return info;
  }
}
