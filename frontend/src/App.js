import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Header from "./components/Header";
import AiChat from "./components/AiChat";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import PostProject from "./pages/PostProject";
import ProjectDetail from "./pages/ProjectDetail";
import Dashboard from "./pages/Dashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import HowItWorks from "./pages/HowItWorks";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Footer from "./components/Footer";
import { Toaster } from "sonner";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) return <div className="p-10 text-muted">Loading…</div>;
  if (user === false) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

function Shell() {
  return (
    <div className="App">
      <div className="mesh-bg" aria-hidden="true"><span /></div>
      <div className="cyber-grid" aria-hidden="true" />
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/post" element={<ProtectedRoute><PostProject /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
      <AiChat />
      <Toaster theme="dark" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
