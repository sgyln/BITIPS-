import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jakarta" });
export const metadata = { title: "BITIPS", description: "Budget-Based Intelligent Travel Itinerary Planning System" };
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans"><Providers>{children}</Providers></body>
    </html>
  );
}
