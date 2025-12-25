import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";

// Sayfalar
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CreateExam from "./pages/CreateExam";
import TakeExam from "./pages/TakeExam";
import ResultsPage from "./pages/ResultsPage";
import ResultDetail from "./pages/ResultDetail";
import Profile from "./pages/Profile";
import Summary from "./pages/Summary";
import SummaryDetail from "./pages/SummaryDetail";
import FlashcardPage from "./pages/FlashcardPage";
import FlashcardDetail from "./pages/FlashcardDetail"; // <--- YENİ EKLENDİ

// ----------------------------------------------------------------------
// GÜVENLİ URL SEÇİCİ (Bunu diğer dosyalara da kopyala)
// ----------------------------------------------------------------------
const getBackendUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  return "http://localhost:8000";
};

const BACKEND_URL = getBackendUrl();
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App bg-[#0f172a] min-h-screen text-slate-200">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <AuthPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/auth" />} />
          
          {/* Özet Rotaları */}
          <Route path="/summary" element={isAuthenticated ? <Summary /> : <Navigate to="/auth" />} />
          <Route path="/summary/:summaryId" element={isAuthenticated ? <SummaryDetail /> : <Navigate to="/auth" />} />
          
          {/* Sınav Rotaları */}
          <Route path="/create" element={isAuthenticated ? <CreateExam /> : <Navigate to="/auth" />} />
          <Route path="/exam/:examId" element={isAuthenticated ? <TakeExam /> : <Navigate to="/auth" />} />
          <Route path="/results" element={isAuthenticated ? <ResultsPage /> : <Navigate to="/auth" />} />
          <Route path="/results/:resultId" element={isAuthenticated ? <ResultDetail /> : <Navigate to="/auth" />} />
          
          {/* Flashcard Rotaları */}
          <Route path="/flashcards" element={isAuthenticated ? <FlashcardPage /> : <Navigate to="/auth" />} />
          <Route path="/flashcards/:id" element={isAuthenticated ? <FlashcardDetail /> : <Navigate to="/auth" />} /> {/* <--- YENİ ROTA */}

        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;