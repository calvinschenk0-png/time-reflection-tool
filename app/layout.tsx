import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Reflection",
  description: "Track where your work time actually goes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
