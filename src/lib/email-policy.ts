export const VIT_DOMAIN = 'vitstudent.ac.in';
export function isVitEmail(email: string) {
  return /^[^\s@]+@vitstudent\.ac\.in$/i.test(email.trim());
}
export const VIT_ONLY_MESSAGE =
  'Drop is currently open to VIT students only. Use your @vitstudent.ac.in email.';
