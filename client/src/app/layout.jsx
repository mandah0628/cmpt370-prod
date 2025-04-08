import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import "./globals.css";

// Load Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata (for SEO and accessibility)
export const metadata = {
  title: "ToolLoop",
  description: "Created by Team SickSix",
};

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <NavBar />
          <main className="flex-grow flex flex-col">{children}</main> 
          <Footer className="mt-auto" /> 
        </AuthProvider>
      </body>
    </html>
  );
}
