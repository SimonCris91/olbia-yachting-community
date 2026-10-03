import type { Metadata } from "next";
import PassportDashboard from "./passport-dashboard";
import "./passport.css";

export const metadata: Metadata = {
  title: "Passaporto Digitale Refit | Olbia Yachting Community",
  description: "Demo operativa bilingue per cronologia tecnica nautica, documenti e manutenzione.",
};

export default function RefitPassportPage() {
  return <PassportDashboard />;
}
