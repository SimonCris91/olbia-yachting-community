import type { Metadata } from "next";
import PassportDashboard from "./passport-dashboard";
import "./passport.css";

export const metadata: Metadata = {
  title: "Passaporto Digitale Refit | Yachting Agent AI",
  description: "Demo operativa bilingue per cronologia tecnica nautica, documenti e manutenzione.",
};

export default function RefitPassportPage() {
  return <PassportDashboard />;
}
