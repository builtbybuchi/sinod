import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Sinod' Admin Panel",
  description: 'Administrative dashboard for Sinod platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}

