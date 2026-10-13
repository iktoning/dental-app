export const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  walk_in: "Datang Langsung",
  phone: "Telepon",
};

export const STATUS_APPOINTMENT_LABELS: Record<string, string> = {
  pending: "Menunggu Konfirmasi",
  confirmed: "Terkonfirmasi",
  in_progress: "Sedang Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak Hadir",
};

export const STATUS_QUEUE_LABELS: Record<string, string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  serving: "Dilayani",
  done: "Selesai",
  skipped: "Dilewati",
};

export const STATUS_INVOICE_LABELS: Record<string, string> = {
  unpaid: "Belum Dibayar",
  partial: "Sebagian",
  paid: "Lunas",
  cancelled: "Dibatalkan",
};
