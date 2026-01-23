import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = environment.apiUrl;
  private locationIqApiKey = 'pk.18858307a3a5460bb640bdbf198dfa28';
  private locationIqBaseUrl = 'https://us1.locationiq.com/v1';

  constructor(private http: HttpClient) { }

  getLocations(): Observable<any> {
    const currentUser : any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${currentUser["token"]}`);

    return this.http.get(`${this.apiUrl}/mess/messlocation`, { headers });
  }

  getCityFromCoordinates(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = {
        key: this.locationIqApiKey,
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json'
      };

      // Make the request to LocationIQ API
      this.http.get(`${this.locationIqBaseUrl}/reverse`, { params: params as any })
        .subscribe({
          next: (response: any) => {

            if (response && response.address) {
              // Try to get city from different possible fields
              const city = response.address.city ||
                          response.address.state_district ||
                          response.address.state;

              if (city) {
                resolve(city);
              } else {
                reject('City not found in address components');
              }
            } else {
              console.log('Invalid LocationIQ response:', response);
              reject('No address found');
            }
          },
          error: (error) => {
            console.error('Error in LocationIQ reverse geocoding:', error);
            reject(error);
          }
        });
    });
  }
}
