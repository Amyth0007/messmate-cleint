export interface Location {
  id: number;
  name: string;
  city: string;
  rating: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  distance: number;
  routeDistance?: string;
  routeDuration?: string;
  image?: string;
}
