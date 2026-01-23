// thali.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Thali, ThaliType } from '../auth/interfaces/thali.interface';
import { AuthService } from '../auth/services/auth-service/auth.service';
import { environment } from 'src/environments/environment';
import { CreateThaliPayload, UpdateThaliPayload } from '../payloads/thali.payload';

@Injectable({
  providedIn: 'root'
})
export class ThaliService {
  private apiUrl = `${environment.apiUrl}/thalis`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

private transformCreateThali(thali: CreateThaliPayload): any {
  return {
    thali_name: thali.thaliName,
    type: thali.type,
    published: thali.published || false,
    editable: true,

    // backend will attach date
    available_from: thali.timeFrom,
    available_until: thali.timeTo,

    rotis: thali.rotis,
    sabzi: thali.sabzi,
    daal: thali.daal,
    daal_replacement: thali.daalReplacement,
    rice: thali.rice,
    salad: thali.salad,
    sweet: thali.sweet,
    sweet_info: thali.sweetInfo,
    other_items: thali.otherItems,
    price: thali.price,
    image: thali.image
  };
}

private transformUpdateThali(thali: UpdateThaliPayload): any {
  return {
    thali_name: thali.thaliName,
    type: thali.type,
    published: thali.published,
    editable: thali.editable,

    // full datetime preserved
    available_from: thali.availableFrom,
    available_until: thali.availableUntil,

    rotis: thali.rotis,
    sabzi: thali.sabzi,
    daal: thali.daal,
    daal_replacement: thali.daalReplacement,
    rice: thali.rice,
    salad: thali.salad,
    sweet: thali.sweet,
    sweet_info: thali.sweetInfo,
    other_items: thali.otherItems,
    price: thali.price,
    image: thali.image
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

// ADD (time-only payload)
addThali(thaliData: CreateThaliPayload): Observable<Thali> {
  const backendThali = this.transformCreateThali(thaliData);
  return this.http.post<Thali>(`${this.apiUrl}/add-thali`, backendThali, {
    headers: this.getHeaders()
  });
}

// UPDATE (full datetime payload)
updateThali(thaliId: number, thaliData: UpdateThaliPayload): Observable<any> {
  const backendThali = this.transformUpdateThali(thaliData);
  return this.http.put(`${this.apiUrl}/update-thali/${thaliId}`, backendThali, {
    headers: this.getHeaders()
  });
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
