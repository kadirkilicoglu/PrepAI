import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles, Settings2, Folder } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function CreateExam() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
  
  // Sınav Ayarları State'i
  const [examConfig, setExamConfig] = useState({
    exam_type: "mixed",
    difficulty: "medium",
    num_questions: 10
  });

  // Klasör State'leri
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("root"); // Varsayılan: Ana Dizin

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
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Lütfen sadece PDF dosyası seçin");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Dosya boyutu 20MB'dan küçük olmalı");
        return;
      }
      setPdfFile(file);
      setPdfName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pdfFile) {
      toast.error("Lütfen bir PDF dosyası seçin");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("exam_type", examConfig.exam_type);
      formData.append("difficulty", examConfig.difficulty);
      formData.append("num_questions", examConfig.num_questions);

      // Klasör seçildiyse (ve 'root' değilse) ekle
      if (selectedFolderId && selectedFolderId !== "root") {
        formData.append("folder_id", selectedFolderId);
      }

      const response = await axios.post(`${API}/exams/create`, formData, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Sınav başarıyla oluşturuldu!");
      navigate(`/exam/${response.data.id}`);
    } catch (error) {
      console.error("Create exam error:", error);
      toast.error(error.response?.data?.detail || "Sınav oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* Arka Plan Efektleri */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Yeni Sınav Oluştur</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-2xl text-white">Sınav Ayarları</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-base">
              PDF dosyanızı yükleyin ve yapay zekanın size özel sorular hazırlamasını bekleyin.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* PDF Upload */}
              <div className="space-y-3">
                <Label className="text-slate-200 text-sm font-medium ml-1">PDF Dosyası</Label>
                <div
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('pdf-input').click()}
                  data-testid="pdf-upload-area"
                >
                  <input
                    id="pdf-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="pdf-file-input"
                  />
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    pdfFile 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-slate-700 bg-slate-800/30 hover:border-indigo-500/50 hover:bg-slate-800/50'
                  }`}>
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-emerald-400 text-lg" data-testid="pdf-file-name">{pdfName}</p>
                          <p className="text-sm text-emerald-500/60">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Yüklendi</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-indigo-500/50">
                          <Upload className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <p className="text-slate-300 font-medium text-lg group-hover:text-white transition-colors">Dosyayı buraya sürükleyin</p>
                          <p className="text-sm text-slate-500 mt-1">veya seçmek için tıklayın (Max 20MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KLASÖR SEÇİMİ (YENİ) */}
              <div className="space-y-3">
                 <Label className="text-slate-200 text-sm font-medium ml-1 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-indigo-400" />
                    Kayıt Yeri (İsteğe Bağlı)
                 </Label>
                 <Select
                    value={selectedFolderId}
                    onValueChange={setSelectedFolderId}
                  >
                    <SelectTrigger className="h-12 bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl">
                      <SelectValue placeholder="Ana Dizin (Dosyasız)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="root" className="focus:bg-slate-800 focus:text-white font-medium text-slate-400">
                        Ana Dizin (Dosyasız)
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id} className="focus:bg-slate-800 focus:text-white">
                            {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Exam Type */}
                <div className="space-y-3">
                  <Label className="text-slate-200 text-sm font-medium ml-1">Sınav Türü</Label>
                  <Select
                    value={examConfig.exam_type}
                    onValueChange={(value) => setExamConfig({ ...examConfig, exam_type: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="mixed" className="focus:bg-slate-800 focus:text-white">Karışık (Önerilen)</SelectItem>
                      <SelectItem value="multiple_choice" className="focus:bg-slate-800 focus:text-white">Çoktan Seçmeli</SelectItem>
                      <SelectItem value="true_false" className="focus:bg-slate-800 focus:text-white">Doğru/Yanlış</SelectItem>
                      <SelectItem value="fill_blank" className="focus:bg-slate-800 focus:text-white">Boşluk Doldurma</SelectItem>
                      <SelectItem value="open_ended" className="focus:bg-slate-800 focus:text-white">Klasik (Açık Uçlu)</SelectItem>
                      <SelectItem value="image_based" className="focus:bg-slate-800 focus:text-white">Görsel Tabanlı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-3">
                  <Label className="text-slate-200 text-sm font-medium ml-1">Zorluk Seviyesi</Label>
                  <Select
                    value={examConfig.difficulty}
                    onValueChange={(value) => setExamConfig({ ...examConfig, difficulty: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="easy" className="text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300">Kolay</SelectItem>
                      <SelectItem value="medium" className="text-amber-400 focus:bg-amber-500/10 focus:text-amber-300">Orta</SelectItem>
                      <SelectItem value="hard" className="text-red-400 focus:bg-red-500/10 focus:text-red-300">Zor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-slate-200 text-sm font-medium ml-1">Soru Sayısı</Label>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">5 - 50 arası</span>
                </div>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  className="h-12 bg-slate-950/50 border-slate-800 text-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl"
                  value={examConfig.num_questions}
                  onChange={(e) => setExamConfig({ ...examConfig, num_questions: parseInt(e.target.value) })}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all mt-6"
                disabled={loading || !pdfFile}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Yapay Zeka Analiz Ediyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Sınavı Oluştur</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}