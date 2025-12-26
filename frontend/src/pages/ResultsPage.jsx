import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ArrowLeft, Trophy, Calendar, CheckCircle2, XCircle, Search, ArrowRight, Target } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function ResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      
      // Hem sonuçları hem de sınav başlıklarını öğrenmek için sınavları çekiyoruz
      const [resultsRes, examsRes] = await Promise.all([
        axios.get(`${API}/results`, { headers }),
        axios.get(`${API}/exams`, { headers })
      ]);

      const examsMap = {};
      examsRes.data.forEach(exam => {
        examsMap[exam.id] = exam.title;
      });

      // Sonuçları sınav başlıklarıyla birleştirip tarihe göre sıralayalım (En yeni en üstte)
      const mergedResults = resultsRes.data.map(result => ({
        ...result,
        examTitle: examsMap[result.exam_id] || "Silinmiş Sınav"
      })).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

      setResults(mergedResults);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Sonuçlar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/50 bg-amber-500/10";
    return "text-red-400 border-red-500/50 bg-red-500/10";
  };

  const filteredResults = results.filter(result => 
    result.examTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Sınav Geçmişi</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
            <Input 
              placeholder="Sınav adı ile ara..." 
              className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-white rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {results.length > 0 && (
            <div className="flex gap-4">
              <div className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-3">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400 text-sm">Toplam: <span className="text-white font-bold">{results.length}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-16 text-center bg-slate-900/30">
            <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {searchTerm ? "Sonuç Bulunamadı" : "Henüz Sınav Çözmediniz"}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              {searchTerm ? "Farklı bir arama terimi deneyin." : "Kendinizi test etmek için hemen yeni bir sınav oluşturun."}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/create')} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                İlk Sınavını Oluştur
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredResults.map((result) => (
              <Card 
                key={result.id}
                onClick={() => navigate(`/results/${result.id}`)}
                className="group border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-sm transition-all cursor-pointer overflow-hidden relative"
              >
                {/* Score Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                  result.score >= 80 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>

                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                    
                    {/* Score Circle */}
                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-xl shrink-0 ${getScoreColor(result.score)}`}>
                      <span className="text-2xl font-bold">{Math.round(result.score)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Puan</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors truncate">
                        {result.examTitle}
                      </h3>
                      
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(result.submitted_at).toLocaleDateString('tr-TR', { 
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4 px-2">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">{result.correct_answers} Doğru</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">{result.total_questions - result.correct_answers} Yanlış</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="bg-slate-800 p-3 rounded-full text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-lg">
                      <ArrowRight className="w-5 h-5" />
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}