// src/types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role?: "admin" | "regular"; // Optional for backward compatibility
}
export interface Reservation {
  id: string;
  userId: string;
  username: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  createdAt: Date;
}

export interface ReservationFormData {
  startTime: Date;
  endTime: Date;
  description?: string;
}
