import "./globals.css";

export const metadata = {
  title: "EvolutionTrip — Digital Welcome Book",
  description: "La tua reception online: consigli, servizi, eventi e menù per i tuoi ospiti.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
