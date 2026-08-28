import HostDashboard from "../../../components/HostDashboard";

// In produzione, questa route sarà protetta da middleware.js (verifica
// sessione Supabase Auth + ruolo host) prima di renderizzare la dashboard.
export default function DashboardPage() {
  return <HostDashboard />;
}
