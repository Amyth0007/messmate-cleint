import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment?.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUserData(): Observable<any> {
    const currentUser : any = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${currentUser["token"]}`);

    return this.http.get(`${this.apiUrl}/user`, { headers });
  }
}
