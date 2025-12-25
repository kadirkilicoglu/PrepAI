import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { FileText, ArrowLeft, Upload, Loader2, Download, GraduationCap, Sparkles, ScrollText, Folder } from "lucide-react";
import { jsPDF } from "jspdf";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Summary() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  
  // Klasör State'leri
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");

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
      console.error("Klasörler yüklenemedi", error);
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

  const handleGenerateSummary = async () => {
    if (!file) return;
    setLoading(true);
    setSummary("");

    const formData = new FormData();
    formData.append("pdf", file);
    
    // Klasör seçildiyse ekle
    if (selectedFolderId) {
        formData.append("folder_id", selectedFolderId);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/summarize`, formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      if (response.data && response.data.summary) {
        setSummary(response.data.summary);
        toast.success("Özet başarıyla oluşturuldu ve kaydedildi! 🎓");
      } else {
        toast.error("Özet boş döndü.");
      }
    } catch (error) {
      console.error("Summary error:", error);
      toast.error("Özet çıkarılırken bir hata oluştu. Dosya boyutunu kontrol edin.");
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
        const splitText = doc.splitTextToSize(summary, 180);
        
        let cursorY = 30;
        splitText.forEach(line => {
            if (cursorY > 280) {
                doc.addPage();
                cursorY = 20;
            }
            doc.text(line, 10, cursorY);
            cursorY += 6;
        });
        
        doc.save("ders-ozeti.pdf");
        toast.success("PDF başarıyla indirildi!");
      };
    } catch (e) {
      doc.text(summary, 10, 10);
      doc.save("ozet.pdf");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      
      {/* Arka Plan Efektleri */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Konu Özeti Çıkar</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 h-full">
          
          {/* Sol: Yükleme ve Ayarlar Alanı */}
          <div className="space-y-6">
            <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl h-fit">
              <CardHeader className="border-b border-slate-800 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl text-white">Ders Materyali</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Ders notlarınızı yükleyin, yapay zeka önemli noktaları sizin için özetlesin.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                
                {/* PDF Yükleme Alanı */}
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
                  <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
                    file 
                      ? 'border-purple-500/50 bg-purple-500/5' 
                      : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50 hover:bg-slate-800/50'
                  }`}>
                    {file ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-400 text-lg">{file.name}</p>
                          <p className="text-sm text-purple-500/60 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Hazır</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-purple-500/50">
                          <Upload className="w-7 h-7 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium text-lg group-hover:text-white transition-colors">PDF Dosyası Yükle</p>
                          <p className="text-sm text-slate-500 mt-1">Sürükle bırak veya seçmek için tıkla</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Klasör Seçimi (YENİ EKLENDİ) */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-400 ml-1">Kayıt Yeri (İsteğe Bağlı)</label>
                    <div className="relative">
                        <div className="absolute left-3 top-3.5 pointer-events-none text-slate-500">
                            <Folder className="w-5 h-5" />
                        </div>
                        <select
                            value={selectedFolderId}
                            onChange={(e) => setSelectedFolderId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                        >
                            <option value="">Ana Dizin (Dosyasız)</option>
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none">
                             <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <Button 
                  onClick={handleGenerateSummary} 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-600/25 transition-all"
                  disabled={!file || loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Profesör İnceliyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span>Özeti Başlat</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sağ: Sonuç Alanı */}
          <div className="h-full">
            {summary ? (
              <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl h-[600px] flex flex-col animate-in fade-in zoom-in duration-300">
                <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-lg text-white">Profesörün Notları</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadPDF}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF İndir
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 flex-1 overflow-auto custom-scrollbar">
                  <div className="prose prose-invert prose-slate max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">
                        {summary}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 bg-slate-900/30 rounded-2xl text-center p-8">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <GraduationCap className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">Henüz Özet Yok</h3>
                <p className="text-slate-500 max-w-xs">Sol taraftan bir PDF yükleyin, kaydedilecek klasörü seçin ve "Özeti Başlat" butonuna basın.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}