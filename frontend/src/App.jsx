import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CreateExam from "./pages/CreateExam";
import TakeExam from "./pages/TakeExam";
import ResultsPage from "./pages/ResultsPage";
import ResultDetail from "./pages/ResultDetail";
import Profile from "./pages/Profile";
import Summary from "./pages/Summary";
import SummaryDetail from "./pages/SummaryDetail"; // <--- IMPORT EKLENDİ

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.url.includes("/api/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4 border-t-indigo-600 border-r-indigo-600"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App bg-gray-50 min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <AuthPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/summary" element={isAuthenticated ? <Summary /> : <Navigate to="/auth" />} />
          <Route path="/summary/:summaryId" element={isAuthenticated ? <SummaryDetail /> : <Navigate to="/auth" />} /> {/* <--- ROTA EKLENDİ */}
          <Route path="/create" element={isAuthenticated ? <CreateExam /> : <Navigate to="/auth" />} />
          <Route path="/exam/:examId" element={isAuthenticated ? <TakeExam /> : <Navigate to="/auth" />} />
          <Route path="/results" element={isAuthenticated ? <ResultsPage /> : <Navigate to="/auth" />} />
          <Route path="/results/:resultId" element={isAuthenticated ? <ResultDetail /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;