import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  Plus, LogOut, BookOpen, Trash2, 
  User, CheckCircle, ScrollText, Brain, 
  Folder, FolderPlus, Home, ChevronRight, RotateCw, GraduationCap
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [exams, setExams] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [folders, setFolders] = useState([]);
  const [completedExams, setCompletedExams] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [averageScore, setAverageScore] = useState("-");
  
  // Filtreleme State'leri
  const [currentFolder, setCurrentFolder] = useState(null); // null = Ana Dizin
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'exam', 'summary', 'flashcard'
  
  // Klasör Oluşturma Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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
      
      const [examsRes, resultsRes, summariesRes, foldersRes, flashcardsRes] = await Promise.allSettled([
        axios.get(`${API}/exams`, authHeader),
        axios.get(`${API}/results`, authHeader),
        axios.get(`${API}/summaries`, authHeader),
        axios.get(`${API}/folders`, authHeader),
        axios.get(`${API}/flashcards`, authHeader)
      ]);

      if (examsRes.status === 'fulfilled') setExams(examsRes.value.data.reverse());
      if (summariesRes.status === 'fulfilled') setSummaries(summariesRes.value.data);
      if (foldersRes.status === 'fulfilled') setFolders(foldersRes.value.data);
      if (flashcardsRes.status === 'fulfilled') setFlashcards(flashcardsRes.value.data);

      if (resultsRes.status === 'fulfilled') {
        const results = resultsRes.value.data;
        const resultsMap = {};
        let totalScore = 0;
        
        results.forEach(result => {
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

  // --- ACTIONS ---

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Çıkış yapıldı");
    window.location.href = "/auth";
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await axios.post(`${API}/folders`, { name: newFolderName }, getAuthHeader());
      toast.success("Klasör oluşturuldu");
      setNewFolderName("");
      setIsFolderModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Klasör oluşturulamadı");
    }
  };

  const handleDeleteFolder = async (folderId, event) => {
    event.stopPropagation();
    if (window.confirm("Bu klasörü silmek istediğinize emin misiniz?")) {
      try {
        await axios.delete(`${API}/folders/${folderId}`, getAuthHeader());
        toast.success("Klasör silindi");
        fetchData();
      } catch (error) { toast.error("Hata oluştu"); }
    }
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

  const handleDeleteSummary = async (summaryId, summaryTitle, event) => {
    event.stopPropagation();
    if (window.confirm(`"${summaryTitle}" özetini silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`${API}/summaries/${summaryId}`, getAuthHeader());
        toast.success("Özet silindi");
        fetchData();
      } catch (error) { toast.error("Hata oluştu"); }
    }
  };

  const handleDeleteFlashcard = async (fcId, fcTitle, event) => {
    event.stopPropagation();
    if (window.confirm(`"${fcTitle}" kart setini silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`${API}/flashcards/${fcId}`, getAuthHeader());
        toast.success("Kart seti silindi");
        fetchData();
      } catch (error) { toast.error("Hata oluştu"); }
    }
  };

  const handleCardClick = (examId) => {
    const result = completedExams[String(examId)];
    if (result) navigate(`/results/${result.id}`);
    else navigate(`/exam/${examId}`);
  };

  const toggleFilter = (filterType) => {
    if (activeFilter === filterType) {
        setActiveFilter('all');
    } else {
        setActiveFilter(filterType);
        if (filterType !== 'all') setCurrentFolder(null); // Filtreye basınca tümünü gör
    }
  };

  // --- FILTRELEME MANTIĞI (DÜZELTİLDİ) ---
  
  // 1. Eğer 'exam' filtresi seçiliyse HEPSİNİ göster.
  // 2. Eğer 'all' ise:
  //    a. Bir klasörün içindeysek (currentFolder varsa): Sadece o klasördekileri göster.
  //    b. Ana dizindeysek (currentFolder yoksa): HEPSİNİ göster (Son eklenenler mantığı).
  
  const displayExams = activeFilter === 'exam' 
    ? exams 
    : (activeFilter === 'all' 
        ? (currentFolder ? exams.filter(e => e.folder_id === currentFolder.id) : exams) 
        : []);

  const displaySummaries = activeFilter === 'summary' 
    ? summaries 
    : (activeFilter === 'all' 
        ? (currentFolder ? summaries.filter(s => s.folder_id === currentFolder.id) : summaries) 
        : []);

  const displayFlashcards = activeFilter === 'flashcard' 
    ? flashcards 
    : (activeFilter === 'all' 
        ? (currentFolder ? flashcards.filter(f => f.folder_id === currentFolder.id) : flashcards) 
        : []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* İstatistikler & Filtre Kartları */}
        {!currentFolder && (
          <div className="grid md:grid-cols-3 gap-6">
             
             {/* Sınav Kartı */}
             <div 
                onClick={() => toggleFilter('exam')}
                className={`bg-slate-900/50 border p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group cursor-pointer transition-all ${activeFilter === 'exam' ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-slate-800 hover:border-indigo-500/50'}`}
             >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-indigo-500/20"></div>
              <div className="flex justify-between items-start relative">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors ${activeFilter === 'exam' ? 'text-indigo-400' : 'text-slate-400'}`}>Toplam Sınav</p>
                  <p className="text-4xl font-bold text-white">{exams.length}</p>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${activeFilter === 'exam' ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Özet Kartı */}
            <div 
                onClick={() => toggleFilter('summary')}
                className={`bg-slate-900/50 border p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group cursor-pointer transition-all ${activeFilter === 'summary' ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-slate-800 hover:border-purple-500/50'}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-purple-500/20"></div>
              <div className="flex justify-between items-start relative">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors ${activeFilter === 'summary' ? 'text-purple-400' : 'text-slate-400'}`}>Oluşturulan Özet</p>
                  <p className="text-4xl font-bold text-white">{summaries.length}</p>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${activeFilter === 'summary' ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-400'}`}>
                  <ScrollText className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Kart Seti Kartı */}
            <div 
                onClick={() => toggleFilter('flashcard')}
                className={`bg-slate-900/50 border p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group cursor-pointer transition-all ${activeFilter === 'flashcard' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/50'}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 transition-all group-hover:bg-emerald-500/20"></div>
              <div className="flex justify-between items-start relative">
                <div>
                  <p className={`text-sm font-medium mb-1 transition-colors ${activeFilter === 'flashcard' ? 'text-emerald-400' : 'text-slate-400'}`}>Kart Seti</p>
                  <p className="text-4xl font-bold text-white">{flashcards.length}</p>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${activeFilter === 'flashcard' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  <RotateCw className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Klasör & Navigasyon */}
        <div className="flex items-center gap-2 text-lg font-medium border-b border-slate-800 pb-4">
            <button 
              onClick={() => { setCurrentFolder(null); setActiveFilter('all'); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${!currentFolder && activeFilter === 'all' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Home className="w-4 h-4" />
              <span>Dosyalarım</span>
            </button>
            
            {currentFolder && activeFilter === 'all' && (
              <>
                <ChevronRight className="w-5 h-5 text-slate-600" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Folder className="w-4 h-4" />
                  <span>{currentFolder.name}</span>
                </div>
              </>
            )}

            {activeFilter !== 'all' && (
                <>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm">
                        {activeFilter === 'exam' ? 'Tüm Sınavlar' : activeFilter === 'summary' ? 'Tüm Özetler' : 'Tüm Kartlar'}
                    </span>
                    <button onClick={() => setActiveFilter('all')} className="text-xs text-red-400 hover:underline ml-1">(Filtreyi Temizle)</button>
                </>
            )}
            
            <div className="ml-auto">
                <button 
                    onClick={() => setIsFolderModalOpen(true)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <FolderPlus className="w-4 h-4" />
                    Yeni Klasör
                </button>
            </div>
        </div>

        {/* Klasör Listesi */}
        {activeFilter === 'all' && !currentFolder && folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {folders.map(folder => (
                <div 
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder)}
                    className="group p-4 bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Folder className="w-6 h-6 text-indigo-500 group-hover:text-indigo-400 shrink-0" />
                        <span className="font-medium text-slate-200 truncate group-hover:text-white">{folder.name}</span>
                    </div>
                    <button 
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                ))}
            </div>
        )}

        {/* --- BÜYÜK AKSİYON KARTLARI --- */}
        {activeFilter === 'all' && !currentFolder && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div 
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 flex items-center justify-between cursor-pointer shadow-lg shadow-indigo-900/20 hover:scale-[1.02] transition-transform group"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Yeni Sınav Oluştur</h3>
                        <p className="text-indigo-100 text-sm">PDF yükleyin, yapay zeka soruları hazırlasın.</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/summary')}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex items-center justify-between cursor-pointer hover:border-slate-600 hover:bg-slate-750 transition-all group"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-slate-200">Konu Özeti Çıkar</h3>
                        <p className="text-slate-400 text-sm">Ders notlarınızı saniyeler içinde özetleyin.</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                        <GraduationCap className="w-6 h-6 text-slate-300" />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/flashcards')}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 hover:bg-slate-750 transition-all group"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Bilgi Kartları</h3>
                        <p className="text-slate-400 text-sm">Önemli kavramları ezberleyin.</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <RotateCw className="w-6 h-6 text-slate-300 group-hover:text-cyan-400" />
                    </div>
                </div>
            </div>
        )}

        {/* --- İÇERİK LİSTESİ --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SOL KOLON: SINAVLAR */}
            {(activeFilter === 'all' || activeFilter === 'exam') && (
                <div className={`${activeFilter === 'exam' ? 'col-span-12' : 'lg:col-span-8'} space-y-4`}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-white">
                            {activeFilter === 'exam' ? 'Tüm Sınavlar' : 'Son Sınavlar'}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                    ) : displayExams.length === 0 ? (
                        <div className="text-slate-500 italic">Görüntülenecek sınav yok.</div>
                    ) : (
                        displayExams.map(exam => {
                            const result = completedExams[String(exam.id)];
                            return (
                                <div 
                                    key={exam.id}
                                    onClick={() => handleCardClick(exam.id)}
                                    className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-between"
                                >
                                    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${result ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                    
                                    <div className="flex items-center gap-4 pl-4 overflow-hidden">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${result ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                            {result ? <CheckCircle className={`w-6 h-6 ${result ? 'text-emerald-400' : 'text-indigo-400'}`} /> : <FileText className="w-6 h-6 text-indigo-400" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1 text-lg">{exam.title}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                                                <span>{exam.difficulty}</span>
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                <span>{exam.questions?.length} Soru</span>
                                                
                                                {/* Klasör Adı (Eğer Klasördeyse) */}
                                                {exam.folder_id && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                        <span className="text-indigo-400 flex items-center gap-1"><Folder className="w-3 h-3"/> {folders.find(f => f.id === exam.folder_id)?.name}</span>
                                                    </>
                                                )}

                                                {result && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                        <span className="text-emerald-400">Puan: {Math.round(result.score)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0 ml-4">
                                        <button 
                                            onClick={(e) => handleDeleteExam(exam.id, exam.title, e)} 
                                            className="text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap ${
                                            result 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                                        }`}>
                                            {result ? 'İncele' : 'Başla'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* SAĞ KOLON: ÖZETLER ve KARTLAR */}
            <div className={`${activeFilter === 'exam' ? 'hidden' : (activeFilter === 'all' ? 'lg:col-span-4' : 'col-span-12')} space-y-8`}>
                
                {/* Özetler */}
                {(activeFilter === 'all' || activeFilter === 'summary') && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">
                                {activeFilter === 'summary' ? 'Tüm Özetler' : 'Kayıtlı Özetler'}
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {displaySummaries.length === 0 ? (
                                <div className="text-slate-500 italic text-sm">Görüntülenecek özet yok.</div>
                            ) : (
                                displaySummaries.map(summary => (
                                    <div 
                                        key={summary.id}
                                        onClick={() => navigate(`/summary/${summary.id}`)}
                                        className="group flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-500/30 hover:bg-slate-800 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                                <ScrollText className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-slate-200 font-medium text-sm truncate group-hover:text-white transition-colors">{summary.title}</h4>
                                                <div className="flex gap-2">
                                                    <p className="text-slate-500 text-xs mt-0.5">{new Date(summary.created_at).toLocaleDateString('tr-TR')}</p>
                                                    {summary.folder_id && (
                                                        <p className="text-purple-400 text-xs mt-0.5 flex items-center gap-1"><Folder className="w-3 h-3"/> {folders.find(f => f.id === summary.folder_id)?.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteSummary(summary.id, summary.title, e)} 
                                            className="text-slate-600 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Kart Setleri */}
                {(activeFilter === 'all' || activeFilter === 'flashcard') && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-cyan-500 rounded-full"></div>
                            <h2 className="text-xl font-bold text-white">
                                {activeFilter === 'flashcard' ? 'Tüm Kart Setleri' : 'Kart Setleri'}
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {displayFlashcards.length === 0 ? (
                                <div className="text-slate-500 italic text-sm">Görüntülenecek kart seti yok.</div>
                            ) : (
                                displayFlashcards.map(fc => (
                                    <div 
                                        key={fc.id}
                                        onClick={() => navigate(`/flashcards/${fc.id}`)}
                                        className="group flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 hover:bg-slate-800 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                                                <RotateCw className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-slate-200 font-medium text-sm truncate group-hover:text-white transition-colors">{fc.title}</h4>
                                                <div className="flex gap-2">
                                                    <p className="text-slate-500 text-xs mt-0.5">{fc.cards?.length} Kart</p>
                                                    {fc.folder_id && (
                                                        <p className="text-cyan-400 text-xs mt-0.5 flex items-center gap-1"><Folder className="w-3 h-3"/> {folders.find(f => f.id === fc.folder_id)?.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteFlashcard(fc.id, fc.title, e)} 
                                            className="text-slate-600 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>

      </main>

      {/* KLASÖR OLUŞTURMA MODALI */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">Yeni Klasör Oluştur</h3>
            <form onSubmit={handleCreateFolder}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Klasör Adı</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Örn: Matematik, Tarih..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="flex-1 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                  >
                    Oluştur
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}