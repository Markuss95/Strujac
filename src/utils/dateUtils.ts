export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("hr-HR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isDateOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && start2 < end1;
};

export const parseDateTime = (dateString: string, timeString: string): Date => {
  // Expected format: dd/mm/yyyy
  const [day, month, year] = dateString.split("/").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};
