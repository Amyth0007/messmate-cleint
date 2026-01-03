// dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from 'src/app/auth/interfaces/location.interface';
import { UserData } from 'src/app/auth/interfaces/user.interface';
import { LocationService } from 'src/app/services/location.service';
import { AuthService } from '../../auth/services/auth-service/auth.service';
import { UserService } from '../../services/user.service';
import { LocationPermissionPopupComponent } from '../shared/location-permission-popup/location-permission-popup.component';
import { MapComponent } from '../shared/map/map.component';
import { MenuDisplayComponent } from '../shared/menu-display/menu-display.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
declare var google: any;





@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, NavbarComponent, MapComponent, MenuDisplayComponent, FormsModule, LocationPermissionPopupComponent]
})
export class DashboardComponent implements OnInit {
  userData: UserData | null = null;
  selectedLocation: Location | null = null;
  userLocation: { lat: number; lng: number } | null = null;
  private directionsService: any;
  selectedCity: string = 'All';
  topCities: string[] = ['All', 'Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];
  messNameSearchQuery: string = '';
  showLocationPopup: boolean = false;
  userCity: string | null = null;

  messLocations: Location[] = []
  // [
  //   {
  //     id: 1,
  //     name: "Annapurna Mess",
  //     description: "Authentic home-style meals with pure ghee",
  //     distance: 0.8,
  //     rating: 4.5,
  //     city: "Pune",
  //     coordinates: { lat: 18.5204, lng: 73.8567 }
  //   },
  //   {
  //     id: 2,
  //     name: "Green Leaf Mess",
  //     description: "Healthy and nutritious vegetarian food",
  //     distance: 1.2,
  //     rating: 4.3,
  //     city: "Pune",
  //     coordinates: { lat: 18.5314, lng: 73.8446 }
  //   },
  //   {
  //     id: 3,
  //     name: "Maharaja Mess",
  //     description: "Premium thalis with variety of items",
  //     distance: 1.5,
  //     rating: 4.7,
  //     city: "Pune",
  //     coordinates: { lat: 18.5123, lng: 73.8289 }
  //   },
  //   {
  //     id: 4,
  //     name: "Mumbai Tiffin",
  //     description: "Delicious Maharashtrian food",
  //     distance: 2.0,
  //     rating: 4.2,
  //     city: "Mumbai",
  //     coordinates: { lat: 19.076, lng: 72.8777 }
  //   },
  //   {
  //     id: 5,
  //     name: "Delhi Thali House",
  //     description: "Authentic North Indian thalis",
  //     distance: 2.3,
  //     rating: 4.4,
  //     city: "Delhi",
  //     coordinates: { lat: 28.6139, lng: 77.209 }
  //   },
  //   {
  //     id: 6,
  //     name: "Bangalore Meals",
  //     description: "South Indian meals with filter coffee",
  //     distance: 1.8,
  //     rating: 4.6,
  //     city: "Bangalore",
  //     coordinates: { lat: 12.9716, lng: 77.5946 }
  //   },
  //   {
  //     id: 7,
  //     name: "Hyderabad Ruchi",
  //     description: "Spicy and flavorful Hyderabadi thalis",
  //     distance: 2.5,
  //     rating: 4.3,
  //     city: "Hyderabad",
  //     coordinates: { lat: 17.385, lng: 78.4867 }
  //   },
  //   {
  //     id: 8,
  //     name: "Chennai Veg Delight",
  //     description: "Pure veg South Indian meals",
  //     distance: 2.7,
  //     rating: 4.1,
  //     city: "Chennai",
  //     coordinates: { lat: 13.0827, lng: 80.2707 }
  //   }
  // ];


  constructor(
    private authService: AuthService,
    private userService: UserService,
    private locationService: LocationService
  ) {
    this.directionsService = new google.maps.DirectionsService();
    this.getmessLocations();
  }

  ngOnInit() {
    // Get user data
    this.userService.getUserData().subscribe({
      next: (data) => {
        this.userData = data;
      },
      error: (error) => {
        if (error)
          this.logout()
        console.error('Error fetching user data:', error);
      }
    });
    this.getmessLocations();

    // Check location permission status
    this.checkLocationPermission();
  }

  private checkLocationPermission() {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        if (permissionStatus.state === 'prompt') {
          this.showLocationPopup = true;
        } else if (permissionStatus.state === 'granted') {
          this.getUserLocation();
        }

        // Listen for changes in permission status
        permissionStatus.addEventListener('change', () => {
          if (permissionStatus.state === 'granted') {
            this.showLocationPopup = false;
            this.getUserLocation();
          }
        });
      });
    } else {
      // If permissions API is not supported, show popup
      this.showLocationPopup = true;
    }
  }

  onLocationAllow() {
    this.showLocationPopup = false;
    this.getUserLocation();
  }

  onLocationDeny() {
    this.showLocationPopup = false;
    // Set default location
    this.userLocation = { lat: 18.5204, lng: 73.8567 };
    this.updateRouteDistances();
  }

  async getUserLocation() {
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          try {
            // Get city from coordinates using LocationIQ
            this.userCity = await this.locationService.getCityFromCoordinates(
              position.coords.latitude,
              position.coords.longitude
            );

            // Check if the found city matches any of our top cities
            const foundCity = this.topCities.find(city =>
              city !== 'All' &&
              (this.userCity?.toLowerCase().includes(city.toLowerCase()) ||
                city.toLowerCase().includes(this.userCity?.toLowerCase() || ''))
            );

            if (foundCity) {
              
              this.selectedCity = foundCity;
              this.updateFilteredLocations();
            } else {
              
              this.selectedCity = 'All';
            }
          } catch (error) {
            console.error('Error getting city from LocationIQ:', error);
            this.selectedCity = 'All';
          }

          // Update distances based on user location
          this.updateRouteDistances();
        },
        (error) => {
          console.error('Error getting location:', error);
          // Set default location (e.g., city center)
          this.userLocation = { lat: 18.5204, lng: 73.8567 };
          this.updateRouteDistances();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      
      // Fallback for browsers that don't support geolocation
      this.userLocation = { lat: 18.5204, lng: 73.8567 };
      this.updateRouteDistances();
    }
  }

  getmessLocations() {
    this.locationService.getLocations().subscribe({
      next: (data: any) => {
        

        this.messLocations = data.data
      },
      error: (error) => {
        this.logout()
        console.error('Error fetching user data:', error);
      }
    });
  }

  get filteredMessLocationsByNameAndCity(): Location[] {

    if (this.selectedCity === 'All') {
      const query = this.messNameSearchQuery.toLowerCase().trim();
      return this.messLocations.filter((location) =>
        location.name.toLowerCase().includes(query)
      );
    }
    let data = this.messLocations.filter(location => {
      const matchesCity = this.selectedCity ? (location.city.toLocaleLowerCase().trim()) === this.selectedCity.toLocaleLowerCase() : true;
      const matchesName = this.messNameSearchQuery
        ? location.name.toLowerCase().includes(this.messNameSearchQuery.toLowerCase().trim())
        : true;
      return matchesCity && matchesName;
    });
    
    
    return data;
  }

  getInitials(name: string): string {
      if (!name) return '?';
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
  }


  async updateRouteDistances() {
    if (!this.userLocation) {
      
      return;
    }

    

    // Update straight-line distances first
    this.messLocations = this.messLocations.map(location => ({
      ...location,
      distance: this.calculateDistance(
        this.userLocation!.lat,
        this.userLocation!.lng,
        location.coordinates.lat,
        location.coordinates.lng
      )
    }));

    // Update route distances
    for (const location of this.messLocations) {
      try {
        const route = await this.getRouteDetails(location);
        location.routeDistance = route.distance;
        location.routeDuration = route.duration;
      } catch (error) {
        console.error('Error getting route for:', location.name, error);
      }
    }
  }

  private getRouteDetails(location: Location): Promise<{ distance: string; duration: string }> {
    return new Promise((resolve, reject) => {
      if (!this.userLocation) {
        reject('No user location available');
        return;
      }

      const request = {
        origin: this.userLocation,
        destination: location.coordinates,
        travelMode: google.maps.TravelMode.DRIVING
      };

      this.directionsService.route(request, (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK) {
          const route = result.routes[0].legs[0];
          resolve({
            distance: route.distance.text,
            duration: route.duration.text
          });
        } else {
          reject(`Failed to get route: ${status}`);
        }
      });
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Number(d.toFixed(1));
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  selectLocation(location: Location) {
    
    this.selectedLocation = { ...location };

    // Scroll to menu section after a short delay to ensure component is rendered
    setTimeout(() => {
      const menuSection = document.getElementById('menu-section');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Add a method to handle city selection changes
  onCityChange() {
    this.updateFilteredLocations();
  }

  private updateFilteredLocations() {
    // This will trigger the getter to update the filtered locations
    this.messLocations = [...this.messLocations];
  }

  logout() {
    this.authService.logout();
  }
}
