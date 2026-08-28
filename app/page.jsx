import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: "sans-serif",
        backgroundColor: "#EDE7D8",
      }}
    >
      <h1 style={{ fontSize: "28px", color: "#1B2A41" }}>EvolutionTrip</h1>
      <p style={{ color: "#6B6455" }}>Scegli quale interfaccia vuoi vedere:</p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          href="/g/demo"
          style={{ padding: "10px 20px", borderRadius: "999px", backgroundColor: "#C2542E", color: "#fff", textDecoration: "none" }}
        >
          App ospite (demo)
        </Link>
        <Link
          href="/dashboard"
          style={{ padding: "10px 20px", borderRadius: "999px", backgroundColor: "#2F7FB0", color: "#fff", textDecoration: "none" }}
        >
          Dashboard host
        </Link>
      </div>
    </main>
  );
}
