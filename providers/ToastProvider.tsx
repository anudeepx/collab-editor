"use client";
import { Toaster } from "sonner";

const ToastProvider = () => {
  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      theme="dark"
      closeButton
      duration={3000}
    />
  )
};

export default ToastProvider;