import ToastProvider from "@/components/ToastProvider";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <ToastProvider />
    </div>
  );
}