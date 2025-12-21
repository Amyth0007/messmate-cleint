// thali.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Thali, ThaliType } from '../auth/interfaces/thali.interface';
import { AuthService } from '../auth/services/auth-service/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ThaliService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Transform new thali data (without id) to backend format
  private transformNewThaliToBackendFormat(thaliData: Omit<Thali, 'id' | 'available_date' | 'availableFrom' | 'availableUntil'>): any {
        // debugger;
    return {
      thali_name: thaliData.thaliName,
      type: thaliData.type,
      published: thaliData.published || false,
      editable: thaliData.editable !== false,
      available_from: thaliData.timeFrom,
      available_until: thaliData.timeTo,
      rotis: thaliData.rotis,
      sabzi: thaliData.sabzi,
      daal: thaliData.daal,
      daal_replacement: thaliData.daalReplacement,
      rice: thaliData.rice,
      salad: thaliData.salad,
      sweet: thaliData.sweet,
      sweet_info: thaliData.sweetInfo,
      other_items: thaliData.otherItems,
      price: thaliData.price,
      image: thaliData.image
    };
  }

  // Transform backend response to frontend format (includes id)
  transformToFrontendFormat(thaliData: any): Thali {
    return {
      id: thaliData.id, // From backend
      thaliName: thaliData.thali_name,
      rotis: thaliData.rotis,
      sabzi: thaliData.sabzi,
      daal: thaliData.daal, // boolean
      daalReplacement: thaliData.daal_replacement,
      rice: thaliData.rice, // boolean
      salad: thaliData.salad, // boolean
      sweet: thaliData.sweet, // boolean
      sweetInfo: thaliData.sweet_info,
      otherItems: thaliData.other_items,
      price: thaliData.price,
      type: thaliData.type as ThaliType,
      image: thaliData.image,
      availableFrom: thaliData.available_from,
      availableUntil: thaliData.available_until,
      available_date: thaliData.available_date,
      published: thaliData.published,
      isDeleted: thaliData.is_deleted,
      editable: thaliData.editable,
      timeFrom: thaliData.available_from ? thaliData.available_from.substring(11, 16) : '',
      timeTo: thaliData.available_until ? thaliData.available_until.substring(11, 16) : ''
    };
  }

  // For adding new thali - accepts data without id
  addThali(thaliData: Omit<Thali, 'id' | 'available_date' | 'availableFrom' | 'availableUntil'>): Observable<Thali> {
    const backendThali = this.transformNewThaliToBackendFormat(thaliData);
    // debugger;
    return this.http.post<Thali>(`${this.apiUrl}/add-thali`, backendThali, { headers: this.getHeaders() });
  }

  // For updating existing thali - requires id
  updateThali(thaliId: number, thaliData: Omit<Thali, 'id' | 'available_date' | 'availableFrom' | 'availableUntil'>): Observable<any> {
    const backendThali = this.transformNewThaliToBackendFormat(thaliData);
    debugger;
    return this.http.put(`${this.apiUrl}/update-thali/${thaliId}`, backendThali, { headers: this.getHeaders() });
  }

  // Delete a thali (soft delete)
  deleteThali(thaliId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-thali/${thaliId}`, { headers: this.getHeaders() });
  }

  // Get thalis with optional filters
  getThalis(messId?: number, type?: string, date?: string): Observable<any> {
    let params = new HttpParams();

    if (messId) {
      params = params.set('messId', messId.toString());
    }

    if (type) {
      params = params.set('type', type);
    }

    if (date) {
      params = params.set('date', date);
    }

    // If no filters are provided, this will get ALL thalis for the mess
    return this.http.get(`${this.apiUrl}/get-thali`, {
      headers: this.getHeaders(),
      params: params
    });
  }
  getMessSpecicficThalis(messId?: number, type?: string, date?: string): Observable<any> {
    let params = new HttpParams();

    if (messId) {
      params = params.set('messId', messId.toString());
    }

    if (type) {
      params = params.set('type', type);
    }

    if (date) {
      params = params.set('date', date);
    }

    // If no filters are provided, this will get ALL thalis for the mess
    return this.http.get(`${this.apiUrl}/get-mess-specific-thalis`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  // Toggle publish status
  togglePublishStatus(thaliId: number, published: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/publish-thali/${thaliId}`,
      { published },
      { headers: this.getHeaders() }
    );
  }
}
