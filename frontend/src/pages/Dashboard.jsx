import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { 
  FileText, Plus, LogOut, History, TrendingUp, 
  BookOpen, Trash2, User, GraduationCap, 
  CheckCircle, PlayCircle, ScrollText, ArrowRight, Brain 
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [completedExams, setCompletedExams] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [averageScore, setAverageScore] = useState("-");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) { setUser(JSON.parse(userData)); }
    fetchData();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = getAuthHeader();
      
      // Verileri paralel çekelim
      const [examsRes, resultsRes, summariesRes] = await Promise.allSettled([
        axios.get(`${API}/exams`, authHeader),
        axios.get(`${API}/results`, authHeader),
        axios.get(`${API}/summaries`, authHeader)
      ]);

      // Sınavlar
      if (examsRes.status === 'fulfilled') {
        setExams(examsRes.value.data.reverse());
      }

      // Özetler
      if (summariesRes.status === 'fulfilled') {
        setSummaries(summariesRes.value.data);
      }

      // Sonuçlar ve Eşleştirme
      if (resultsRes.status === 'fulfilled') {
        const results = resultsRes.value.data;
        const resultsMap = {};
        let totalScore = 0;
        
        results.forEach(result => {
          // exam_id'yi string'e çevirerek garantiye alalım
          resultsMap[String(result.exam_id)] = result;
          totalScore += result.score;
        });
        
        setCompletedExams(resultsMap);

        if (results.length > 0) {
          setAverageScore((totalScore / results.length).toFixed(1));
        }
      }

    } catch (error) {
      console.error("Veri hatası:", error);
      if (error.response && error.response.status === 401) { handleLogout(); }
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Çıkış yapıldı");
    window.location.href = "/auth";
  };

  const handleDeleteExam = async (examId, examTitle, event) => {
    event.stopPropagation();
    if (window.confirm(`"${examTitle}" sınavını silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`${API}/exams/${examId}`, getAuthHeader());
        toast.success("Sınav silindi");
        fetchData();
      } catch (error) { toast.error("Hata oluştu"); }
    }
  };

  // Yönlendirme Fonksiyonu
  const handleCardClick = (examId) => {
    const result = completedExams[String(examId)];
    if (result) {
        navigate(`/results/${result.id}`);
    } else {
        navigate(`/exam/${examId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              PrepAI
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 py-2 px-4 rounded-full transition-all border border-transparent hover:border-slate-700"
              onClick={() => navigate('/profile')}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="text-xs text-slate-400">Hesap Ayarları</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* İstatistikler */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-indigo-500/20"></div>
            <div className="flex justify-between items-start relative">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Toplam Sınav</p>
                <p className="text-4xl font-bold text-white">{exams.length}</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-purple-500/20"></div>
            <div className="flex justify-between items-start relative">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Oluşturulan Özet</p>
                <p className="text-4xl font-bold text-white">{summaries.length}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <ScrollText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-emerald-500/20"></div>
            <div className="flex justify-between items-start relative">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Ortalama Başarı</p>
                <p className="text-4xl font-bold text-white">{averageScore !== "-" ? `%${averageScore}` : "-"}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate('/create')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-left shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.01] hover:shadow-indigo-900/40"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all group-hover:bg-white/20"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Yeni Sınav Oluştur</h3>
                <p className="mt-1 text-indigo-100/80 text-sm">PDF yükleyin, yapay zeka soruları hazırlasın.</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/summary')}
            className="group relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-8 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Konu Özeti Çıkar</h3>
                <p className="mt-1 text-slate-400 text-sm">Ders notlarınızı saniyeler içinde özetleyin.</p>
              </div>
              <div className="bg-slate-700 p-3 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-slate-300 group-hover:text-emerald-400" />
              </div>
            </div>
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Sınav Listesi (Sol - Geniş) */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Son Sınavlar
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
            ) : exams.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-2xl p-12 text-center bg-slate-900/30">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Henüz sınav oluşturulmadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.slice(0, 10).map((exam) => {
                  const result = completedExams[String(exam.id)];
                  return (
                    <div 
                      key={exam.id}
                      onClick={() => handleCardClick(exam.id)}
                      className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center justify-between"
                    >
                      {/* Sol Kenar Çizgisi */}
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${result ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                      
                      <div className="flex items-center gap-4 pl-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold border ${
                          result 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {result ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">{exam.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span className="uppercase text-xs font-bold tracking-wider">{exam.difficulty}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>{exam.questions?.length || 0} Soru</span>
                            {result && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-emerald-400 font-medium">Puan: {Math.round(result.score)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleDeleteExam(exam.id, exam.title, e)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          result 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 group-hover:bg-indigo-500'
                        }`}>
                          {result ? 'İncele' : 'Başla'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Özetler (Sağ - Dar) */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Kayıtlı Özetler
            </h2>
            
            {summaries.length === 0 ? (
              <div className="border border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-900/30">
                <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Henüz özetiniz yok.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summaries.slice(0, 5).map((summary) => (
                  <div 
                    key={summary.id}
                    onClick={() => navigate(`/summary/${summary.id}`)}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 group-hover:text-purple-300 transition-colors">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-200 font-medium text-sm line-clamp-1 group-hover:text-white transition-colors">{summary.title}</h4>
                        <p className="text-slate-500 text-xs mt-1">{new Date(summary.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {summaries.length > 5 && (
                  <button onClick={() => navigate('/summary')} className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700 rounded-lg">
                    Tümünü Gör
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}