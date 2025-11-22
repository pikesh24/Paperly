import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Paperly",
  description: "Premium Notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* CHANGE THIS CLASS FROM 'app-container' TO 'app-layout' */}
        <div className="app-layout"> 
          <Sidebar />
          {/* AND ENSURE THIS HAS THE CLASS 'main-scroll-area' */}
          <main className="main-scroll-area">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}