import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, BarChart3, AlertCircle, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function ResultDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultAndExam();
  }, [resultId]);

  const fetchResultAndExam = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      // 1. Önce sonucu çek
      const resultRes = await axios.get(`${API}/results/${resultId}`, { headers });
      setResult(resultRes.data);

      // 2. Sonucun içindeki exam_id ile sınavın orijinal sorularını çek
      const examRes = await axios.get(`${API}/exams/${resultRes.data.exam_id}`, { headers });
      setExam(examRes.data);

    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Detaylar yüklenirken hata oluştu.");
      navigate("/results");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]";
    if (score >= 50) return "text-amber-400 border-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]";
    return "text-red-400 border-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]";
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
    );
  }

  if (!result || !exam) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/results")} 
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Sonuç Analizi</h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(result.submitted_at).toLocaleDateString("tr-TR", {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 pb-20">

        {/* Özet Kartı */}
        <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    
                    {/* Sol: Bilgiler */}
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-2xl font-bold text-white">{exam.title}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-400">
                            <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                                {result.total_questions} Soru
                            </span>
                            <span className="bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700 uppercase">
                                {exam.difficulty}
                            </span>
                        </div>
                    </div>

                    {/* Orta: İstatistikler */}
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-emerald-400 mb-1">{result.correct_answers}</div>
                            <div className="text-xs text-emerald-500/70 font-medium uppercase tracking-wider">Doğru</div>
                        </div>
                        <div className="w-px h-12 bg-slate-800"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-400 mb-1">{result.total_questions - result.correct_answers}</div>
                            <div className="text-xs text-red-500/70 font-medium uppercase tracking-wider">Yanlış</div>
                        </div>
                    </div>

                    {/* Sağ: Puan Halkası */}
                    <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm ${getScoreColor(result.score)}`}>
                        <span className="text-3xl font-bold">{Math.round(result.score)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Puan</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Sorular ve Analizler */}
        <div className="space-y-6">
            {result.feedback.map((item, index) => {
                const originalQuestion = exam.questions.find(q => q.id === item.question_id);
                const isCorrect = item.is_correct;

                return (
                    <Card 
                        key={index} 
                        className={`border bg-slate-900/40 backdrop-blur-sm overflow-hidden transition-all hover:bg-slate-900/60 ${
                            isCorrect 
                                ? 'border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]' 
                                : 'border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]'
                        }`}
                    >
                        <CardHeader className="pb-4 border-b border-slate-800/50">
                            <div className="flex gap-4">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${
                                    isCorrect 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            isCorrect 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {isCorrect ? "Doğru" : "Yanlış"}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg text-slate-200 font-medium leading-relaxed">
                                        {originalQuestion ? originalQuestion.question_text : "Soru metni bulunamadı"}
                                    </CardTitle>
                                    
                                    {/* Eğer soru görsel içeriyorsa göster */}
                                    {originalQuestion?.image_data && (
                                        <div className="mt-4 rounded-lg overflow-hidden border border-slate-700 max-w-md">
                                            <img 
                                                src={`data:image/jpeg;base64,${originalQuestion.image_data}`} 
                                                alt="Soru görseli" 
                                                className="w-full object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6 space-y-6">
                            {/* Cevap Karşılaştırması */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${
                                    isCorrect 
                                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                                        : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                    <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Sizin Cevabınız</p>
                                    <div className="flex items-start gap-2 text-sm font-medium">
                                        {isCorrect 
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> 
                                            : <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                        }
                                        <span className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                                            {item.user_answer || "(Boş Bırakıldı)"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30">
                                    <p className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Doğru Cevap</p>
                                    <div className="flex items-start gap-2 text-sm font-medium text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500/70 mt-0.5" />
                                        <span>{item.correct_answer}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Açıklama Alanı */}
                            {item.explanation && (
                                <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-indigo-300 mb-1 text-sm">Yapay Zeka Açıklaması</p>
                                            <p className="text-indigo-100/80 text-sm leading-relaxed">{item.explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    </div>
  );
}