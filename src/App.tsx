import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Workspace from './pages/Workspace/Workspace';
import WorkspaceSettings from './pages/WorkspaceSettings/WorkspaceSettings';


export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={session ? <Home /> : <Navigate to="/login" />} />
        <Route path="/workspace/:id" element={session ? <Workspace /> : <Navigate to="/login" />} />
        <Route
          path="/workspace/:id/settings"
          element={session ? <WorkspaceSettings /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}