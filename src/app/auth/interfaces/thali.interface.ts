// thali.interface.ts
export interface Thali {
  id: number;
  thaliName: string;
  type: ThaliType;
  published: boolean;
  editable: boolean;
  isDeleted: boolean;

  // Required fields
  rotis: number;
  sabzi: string;
  daal: boolean;
  daalReplacement: string;
  rice: boolean;
  salad: boolean;
  sweet: boolean;
  sweetInfo: string;
  otherItems: string;
  price: number;

  // Backend datetime fields
  availableFrom: string;
  availableUntil: string;

  // Frontend time fields
  timeFrom: string;
  timeTo: string;

  // Image
  image: string;

  // Optional - set by backend
  available_date?: string;
}

export enum ThaliType {
  Lunch = 'lunch',
  Dinner = 'dinner'
}


