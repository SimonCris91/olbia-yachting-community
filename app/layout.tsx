import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./plans.css";
import "./modal.css";
import "./chat.css";
import "./response.css";
import "./testing.css";
import "./marketplace.css";
import "./forms.css";
import "./sections.css";
import "./install.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barcaora AI - Your AI Yachting Assistant",
  description: "Identifica componenti, trova ricambi e professionisti, organizza acquisti e lavori della tua imbarcazione.",
  manifest: "/manifest.webmanifest",
  themeColor: "#09283b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body className={geist.variable}>{children}</body></html>;
}
