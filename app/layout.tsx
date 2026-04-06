import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabEditor - Real-Time Collaborative Editor",
  description: "CollabEditor is a real-time collaborative editor built with Next.js, NestJS, and Socket.IO. Create, edit, and share documents with your team seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
