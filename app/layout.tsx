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
import "./legal.css";
import "./shop.css";
import "./directory.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://metayachting-ai.simonecris91.chatgpt.site"),
  title: "Olbia Yachting Community - Request Assistant",
  description: "Trasforma richieste nautiche confuse in schede ordinate, priorita chiare e messaggi pronti per tecnici, cantieri e clienti.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/yachting-community-logo.png", apple: "/yachting-community-logo.png" },
  themeColor: "#09283b",
  openGraph: {
    title: "Olbia Yachting Community - Request Assistant",
    description: "Richieste nautiche ordinate, priorita chiare e messaggi pronti per il territorio di Olbia.",
    images: [{ url: "/og.png", width: 2032, height: 774, alt: "Olbia Yachting Community" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olbia Yachting Community - Request Assistant",
    description: "Richieste nautiche ordinate, priorita chiare e messaggi pronti per il territorio di Olbia.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body className={geist.variable}>{children}</body></html>;
}
