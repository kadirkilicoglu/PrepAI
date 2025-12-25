import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { ArrowLeft, Loader2, RotateCw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

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
export default function FlashcardDetail() {
  const { id } = useParams(); // URL'den ID'yi al
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchFlashcardSet();
  }, [id]);

  const fetchFlashcardSet = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/flashcards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlashcardSet(response.data);
    } catch (error) {
      console.error("Kart seti yüklenemedi", error);
      toast.error("Kart seti bulunamadı.");
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bu kart setini silmek istediğinize emin misiniz?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API}/flashcards/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Kart seti silindi.");
        navigate('/');
      } catch (error) {
        toast.error("Silme işlemi başarısız.");
      }
    }
  };

  // Kart Kontrolleri
  const handleNext = () => {
    if (flashcardSet && currentCardIndex < flashcardSet.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!flashcardSet) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Arka Plan */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <RotateCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{flashcardSet.title}</h1>
                <p className="text-xs text-slate-400">{flashcardSet.cards.length} Kart</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost"
            onClick={handleDelete}
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        
        {/* İlerleme */}
        <div className="w-full flex justify-between text-slate-400 text-sm font-medium mb-6">
            <span>Kart {currentCardIndex + 1} / {flashcardSet.cards.length}</span>
            <span>{Math.round(((currentCardIndex + 1) / flashcardSet.cards.length) * 100)}%</span>
        </div>

        {/* --- FLIP CARD --- */}
        <div 
            className="w-full h-96 relative cursor-pointer group perspective-1000 mb-8"
            onClick={handleFlip}
        >
            <div className={`w-full h-full duration-500 preserve-3d absolute ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* ÖN YÜZ (TERİM) */}
                <div className="absolute backface-hidden w-full h-full bg-slate-800/80 border-2 border-slate-700 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl hover:border-cyan-500/50 transition-colors">
                    <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6 bg-cyan-500/10 px-3 py-1 rounded-full">Soru / Kavram</span>
                    <h3 className="text-3xl font-bold text-white text-center leading-relaxed">
                        {flashcardSet.cards[currentCardIndex].term}
                    </h3>
                    <p className="text-slate-500 text-xs mt-8 absolute bottom-6 flex items-center gap-2">
                        <RotateCw className="w-3 h-3" />
                        Cevabı görmek için tıklayın
                    </p>
                </div>

                {/* ARKA YÜZ (TANIM) */}
                <div className="absolute backface-hidden w-full h-full bg-[#0f172a] border-2 border-cyan-500/50 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl rotate-y-180">
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 bg-emerald-500/10 px-3 py-1 rounded-full">Cevap / Tanım</span>
                    <p className="text-xl text-slate-200 text-center leading-relaxed font-medium">
                        {flashcardSet.cards[currentCardIndex].definition}
                    </p>
                </div>
            </div>
        </div>

        {/* Kontroller */}
        <div className="flex items-center gap-6">
            <Button 
                variant="outline" 
                onClick={handlePrev} 
                disabled={currentCardIndex === 0}
                className="h-14 w-14 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white p-0 transition-all"
            >
                <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="text-slate-500 text-sm font-medium">
                {currentCardIndex + 1} / {flashcardSet.cards.length}
            </div>

            <Button 
                variant="outline" 
                onClick={handleNext} 
                disabled={currentCardIndex === flashcardSet.cards.length - 1}
                className="h-14 w-14 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white p-0 transition-all"
            >
                <ChevronRight className="w-6 h-6" />
            </Button>
        </div>

      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}