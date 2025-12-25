import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles, Folder, RotateCw, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function FlashcardPage() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  
  // Flashcard State
  const [flashcardSet, setFlashcardSet] = useState(null); // Oluşturulan set
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // Hangi karttayız
  const [isFlipped, setIsFlipped] = useState(false); // Kart döndü mü?

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data);
    } catch (error) {
      console.error("Klasör hatası", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Lütfen geçerli bir PDF dosyası seçin.");
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    if (selectedFolderId) formData.append("folder_id", selectedFolderId);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/flashcards/create`, formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      setFlashcardSet(response.data);
      toast.success("Kartlar başarıyla oluşturuldu! 🧠");
    } catch (error) {
      console.error("Flashcard error:", error);
      toast.error("Kartlar oluşturulamadı.");
    } finally {
      setLoading(false);
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

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Arka Plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <RotateCw className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Bilgi Kartları</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        
        {/* MOD 1: YÜKLEME EKRANI */}
        {!flashcardSet ? (
          <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            <CardContent className="pt-8 space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <GraduationCap className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Kart Seti Oluştur</h2>
                <p className="text-slate-400 mt-2">Ders notlarını yükle, yapay zeka senin için ezber kartları hazırlasın.</p>
              </div>

              {/* Dosya Yükleme */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => document.getElementById('pdf-input').click()}
              >
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  file 
                    ? 'border-indigo-500/50 bg-indigo-500/5' 
                    : 'border-slate-700 bg-slate-800/30 hover:border-indigo-500/50 hover:bg-slate-800/50'
                }`}>
                  {file ? (
                    <div className="flex items-center justify-center gap-4">
                      <FileText className="w-8 h-8 text-indigo-400" />
                      <div className="text-left">
                        <p className="font-semibold text-indigo-400">{file.name}</p>
                        <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <p className="text-slate-400">PDF yüklemek için tıklayın</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Klasör Seçimi */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 ml-1">Kayıt Yeri</label>
                <div className="relative">
                    <div className="absolute left-3 top-3.5 pointer-events-none text-slate-500">
                        <Folder className="w-5 h-5" />
                    </div>
                    <select
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                        <option value="">Ana Dizin (Dosyasız)</option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                    </select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20"
                disabled={!file || loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Kartlar Hazırlanıyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Oluştur</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          
          /* MOD 2: KART ÇALIŞMA EKRANI */
          <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
            
            {/* İlerleme Çubuğu */}
            <div className="w-full flex justify-between text-slate-400 text-sm font-medium">
                <span>Kart {currentCardIndex + 1} / {flashcardSet.cards.length}</span>
                <span>{Math.round(((currentCardIndex + 1) / flashcardSet.cards.length) * 100)}% Tamamlandı</span>
            </div>
            
            {/* KART (FLIP CARD) */}
            <div 
                className="w-full h-96 relative cursor-pointer group perspective-1000"
                onClick={handleFlip}
            >
                <div className={`w-full h-full duration-500 preserve-3d absolute ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* ÖN YÜZ (SORU/TERİM) */}
                    <div className="absolute backface-hidden w-full h-full bg-slate-800 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl hover:border-indigo-500/50 transition-colors">
                        <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-6">Kavram / Soru</span>
                        <h3 className="text-3xl font-bold text-white text-center leading-relaxed">
                            {flashcardSet.cards[currentCardIndex].term}
                        </h3>
                        <p className="text-slate-500 text-xs mt-8 absolute bottom-6">Cevabı görmek için tıklayın</p>
                    </div>

                    {/* ARKA YÜZ (CEVAP/TANIM) */}
                    <div className="absolute backface-hidden w-full h-full bg-indigo-900/20 border-2 border-indigo-500/50 rounded-3xl flex flex-col items-center justify-center p-8 shadow-2xl rotate-y-180 bg-[#0f172a]">
                        <span className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">Tanım / Cevap</span>
                        <p className="text-xl text-slate-200 text-center leading-relaxed font-medium">
                            {flashcardSet.cards[currentCardIndex].definition}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigasyon Butonları */}
            <div className="flex items-center gap-6">
                <Button 
                    variant="outline" 
                    onClick={handlePrev} 
                    disabled={currentCardIndex === 0}
                    className="h-12 w-12 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 p-0"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <Button 
                    onClick={() => setFlashcardSet(null)} 
                    variant="ghost" 
                    className="text-slate-400 hover:text-white"
                >
                    Yeni Set Oluştur
                </Button>

                <Button 
                    variant="outline" 
                    onClick={handleNext} 
                    disabled={currentCardIndex === flashcardSet.cards.length - 1}
                    className="h-12 w-12 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 p-0"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

          </div>
        )}

      </div>

      {/* Flip Animasyonu İçin CSS (Tailwind config'e eklemek yerine buraya style olarak gömüyoruz) */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}