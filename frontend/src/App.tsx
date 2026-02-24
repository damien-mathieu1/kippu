import { Header } from "./components/layout/Header";
import { Dashboard } from "./components/dashboard/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Dashboard />
    </div>
  );
}

export default App;
