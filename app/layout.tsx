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
import "./controller/controller.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://yachting.aquariusageai.com"),
  title: "Yachting Agent AI | L’agente nautico intelligente",
  description: "Yachting Agent AI, l’agente nautico intelligente per identificare componenti, trovare ricambi e organizzare lavori di bordo.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/yachting-agent-ai-mark.png", apple: "/yachting-agent-ai-mark.png" },
  themeColor: "#09283b",
  openGraph: {
    title: "Yachting Agent AI",
    description: "L’agente nautico intelligente per la tua barca.",
    images: [{ url: "/yachting-agent-ai-hero.png", width: 1536, height: 1024, alt: "Yachting Agent AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yachting Agent AI",
    description: "L’agente nautico intelligente per la tua barca.",
    images: ["/yachting-agent-ai-hero.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body className={geist.variable}>{children}</body></html>;
}
