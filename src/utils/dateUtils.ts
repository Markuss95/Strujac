// src/utils/dateUtils.ts
// Add this line at the top to make it a module
import { Dispatch, SetStateAction } from "react";

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

export const isDateOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && start2 < end1;
};

// Add more date utility functions as needed
export const parseDateTime = (dateString: string, timeString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// This ensures the file is treated as a module
export type DateSetState = Dispatch<SetStateAction<Date>>;
