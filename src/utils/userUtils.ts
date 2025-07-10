// src/utils/userUtils.ts
export const formatUsername = (email: string): string => {
  const username = email.split("@")[0];
  const parts = username.split(".");
  if (parts.length >= 2) {
    const firstName =
      parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastName =
      parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return `${firstName} ${lastName}`;
  }
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};
