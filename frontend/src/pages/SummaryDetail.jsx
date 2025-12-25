import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Download, Calendar, GraduationCap, Loader2, BookOpen, Sparkles } from "lucide-react"; // <-- Sparkles eklendi
import { jsPDF } from "jspdf";
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

export default function SummaryDetail() {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [summaryId]);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/summaries/${summaryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Özet yüklenirken hata oluştu.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!summary) return;
    const doc = new jsPDF();

    try {
      const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
      const response = await fetch(fontUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        const base64data = reader.result.split(',')[1];
        doc.addFileToVFS("Roboto-Regular.ttf", base64data);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        doc.setFont("Roboto");

        doc.setFontSize(16);
        doc.text("Ders Özeti (PrepAI)", 10, 20);
        
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(summary.content, 180);
        
        let cursorY = 30;
        splitText.forEach(line => {
            if (cursorY > 280) {
                doc.addPage();
                cursorY = 20;
            }
            doc.text(line, 10, cursorY);
            cursorY += 6;
        });
        
        doc.save(`${summary.title || "ders-ozeti"}.pdf`);
        toast.success("PDF başarıyla indirildi!");
      };
    } catch (e) {
      doc.text(summary.content, 10, 10);
      doc.save("ozet.pdf");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")} 
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Özet Detayı</h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(summary.created_at).toLocaleDateString("tr-TR", {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleDownloadPDF} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">PDF İndir</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 pb-20">
        <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            
            {/* Dekoratif Arka Plan Işığı */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            
            <CardHeader className="bg-slate-900/50 border-b border-slate-800/50 py-8 px-8">
                <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 shadow-inner">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-2xl text-white font-bold leading-snug mb-2">
                            {summary.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                                AI Özeti
                            </span>
                            <span>•</span>
                            <span>Profesör Modu</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-8 sm:p-10">
                <div className="prose prose-invert prose-lg max-w-none prose-headings:text-indigo-300 prose-strong:text-white prose-li:text-slate-300">
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                        {summary.content}
                    </div>
                </div>
                
                {/* Alt Bilgi */}
                <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-center text-slate-500 text-sm italic">
                    <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                    Bu özet yapay zeka tarafından oluşturulmuştur.
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}