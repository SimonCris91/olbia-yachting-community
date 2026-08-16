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

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://metayachting-ai.simonecris91.chatgpt.site"),
  title: "Olbia Yachting Community - Yachting Assistant",
  description: "Identifica componenti, trova ricambi e professionisti, organizza acquisti e lavori della tua imbarcazione con la community di Olbia.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/yachting-community-logo.png", apple: "/yachting-community-logo.png" },
  themeColor: "#09283b",
  openGraph: {
    title: "Olbia Yachting Community",
    description: "Connect. Share. Sail. La community nautica di Olbia con il suo Yachting Assistant.",
    images: [{ url: "/og.png", width: 2032, height: 774, alt: "Olbia Yachting Community" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olbia Yachting Community",
    description: "Connect. Share. Sail. La community nautica di Olbia con il suo Yachting Assistant.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body className={geist.variable}>{children}</body></html>;
}
