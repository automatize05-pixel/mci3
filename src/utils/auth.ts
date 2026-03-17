export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const adminPattern = /ageusilva905/i;
  return adminPattern.test(email);
};
