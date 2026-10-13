/**
 * Dapatkan tanggal hari ini dalam format YYYY-MM-DD berdasarkan timezone lokal server.
 * Lebih aman daripada `new Date().toISOString().slice(0, 10)` yang pakai UTC.
 */
export const todayLocal = (timezone = "Asia/Jakarta"): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // en-CA format: YYYY-MM-DD
};

/**
 * Konversi string tanggal ke format YYYY-MM-DD (validasi ringan).
 * Menerima ISO string, date string, atau Date object.
 */
export const toDateString = (
  input: string | Date,
  timezone = "Asia/Jakarta",
): string => {
  const d = typeof input === "string" ? new Date(input) : input;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
};
