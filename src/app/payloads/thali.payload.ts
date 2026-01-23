import { Thali } from "../auth/interfaces/thali.interface";

export type CreateThaliPayload = Omit<
  Thali,
  'id' | 'available_date' | 'availableFrom' | 'availableUntil'
>;


export type UpdateThaliPayload = Omit<
  Thali,
  'id' | 'available_date' | 'timeFrom' | 'timeTo'
>;
