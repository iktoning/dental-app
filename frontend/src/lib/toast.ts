import { create } from "zustand";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

type ToastState = {
  toasts: Toast[];
  show: (type: Toast["type"], message: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (type, message) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// Shortcut functions
export const toast = {
  success: (msg: string) => useToastStore.getState().show("success", msg),
  error: (msg: string) => useToastStore.getState().show("error", msg),
  info: (msg: string) => useToastStore.getState().show("info", msg),
};
