import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Send, FileText, CheckCircle2, Clock, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

// ----------------------------------------------------------------------
// GÜVENLİ URL SEÇİCİ (Vite + CRA Uyumlu - Hata Korumalı Versiyon)
// ----------------------------------------------------------------------
const getBackendUrl = () => {
  // 1. Vite Kontrolü (Localde npm run dev için)
  try {
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
  } catch (err) {
    // import.meta desteklenmiyorsa burayı sessizce geçer
  }

  // 2. CRA / Vercel Kontrolü (Canlı sitede burası çalışacak)
  try {
    // process.env kontrolü
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
  } catch (err) {
    // process tanımlı değilse hatayı yutar
  }

  // 3. Hiçbiri yoksa Localhost'a döner
  return "http://localhost:8000";
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const response = await axios.get(`${API}/exams/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setExam(response.data);
    } catch (error) {
      toast.error("Sınav yüklenemedi");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // --- PDF İNDİRME FONKSİYONU ---
  const handleDownloadPDF = async () => {
    if (!exam) return;
    setDownloading(true);
    const doc = new jsPDF();

    try {
      // 1. Türkçe Karakter Desteği İçin Font Yükle
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

        // 2. Başlık ve Bilgiler
        doc.setFontSize(18);
        doc.text(exam.title, 10, 20);
        
        doc.setFontSize(10);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 10, 28);
        doc.text(`Ad Soyad: _______________________`, 150, 28, { align: 'right' });
        doc.line(10, 32, 200, 32); // Ayırıcı Çizgi

        let cursorY = 40;
        const pageHeight = doc.internal.pageSize.height;

        // 3. Soruları Döngüye Al
        exam.questions.forEach((q, index) => {
            // Sayfa Sonu Kontrolü
            if (cursorY > pageHeight - 30) {
                doc.addPage();
                cursorY = 20;
            }

            // Soru Metni
            doc.setFontSize(12);
            doc.setFont("Roboto", "bold");
            const questionTitle = `Soru ${index + 1}:`;
            doc.text(questionTitle, 10, cursorY);
            
            doc.setFont("Roboto", "normal");
            const splitQuestion = doc.splitTextToSize(q.question_text, 180);
            doc.text(splitQuestion, 10, cursorY + 6);
            
            // Metin yüksekliğini hesapla
            cursorY += 6 + (splitQuestion.length * 5) + 5;

            // Soru Tipine Göre İçerik
            if (q.question_type === 'multiple_choice') {
                q.options.forEach((opt) => {
                    if (cursorY > pageHeight - 15) { doc.addPage(); cursorY = 20; }
                    doc.circle(12, cursorY - 1, 1.5); // Radyo butonu efekti
                    doc.text(opt, 16, cursorY);
                    cursorY += 7;
                });
            } 
            else if (q.question_type === 'true_false') {
                doc.text("(   ) Doğru", 16, cursorY);
                doc.text("(   ) Yanlış", 50, cursorY);
                cursorY += 10;
            }
            else if (q.question_type === 'fill_blank' || q.question_type === 'open_ended') {
                doc.setDrawColor(200);
                doc.line(10, cursorY + 5, 200, cursorY + 5);
                doc.line(10, cursorY + 12, 200, cursorY + 12);
                if (q.question_type === 'open_ended') {
                    doc.line(10, cursorY + 19, 200, cursorY + 19);
                    cursorY += 10;
                }
                cursorY += 20;
            }
            else if (q.question_type === 'image_based' && q.image_data) {
                 // Görsel varsa ekle (Basit yerleşim)
                 try {
                    doc.addImage(`data:image/jpeg;base64,${q.image_data}`, 'JPEG', 10, cursorY, 80, 60, undefined, 'FAST');
                    cursorY += 65;
                 } catch (e) {
                    doc.text("[Görsel]", 10, cursorY);
                    cursorY += 10;
                 }
                 // Seçenekleri görselin altına ekle
                 q.options?.forEach((opt) => {
                    if (cursorY > pageHeight - 15) { doc.addPage(); cursorY = 20; }
                    doc.circle(12, cursorY - 1, 1.5);
                    doc.text(opt, 16, cursorY);
                    cursorY += 7;
                });
            }

            cursorY += 5; // Sorular arası boşluk
        });

        // 4. İndir
        doc.save(`${exam.title || 'sinav'}.pdf`);
        toast.success("PDF indirildi!");
        setDownloading(false);
      };
    } catch (e) {
      console.error("PDF Hatası:", e);
      toast.error("PDF oluşturulurken hata oluştu.");
      setDownloading(false);
    }
  };

  const handleSubmit = async () => {
    const answeredQuestions = Object.keys(answers).length;
    const totalQuestions = exam.questions.length;

    if (answeredQuestions < totalQuestions) {
      const confirmSubmit = window.confirm(
        `${totalQuestions - answeredQuestions} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);

    try {
      const submission = {
        exam_id: examId,
        answers: Object.entries(answers).map(([question_id, user_answer]) => ({
          question_id,
          user_answer
        }))
      };

      const response = await axios.post(`${API}/exams/submit`, submission, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success("Sınav başarıyla gönderildi!");
      navigate(`/results/${response.data.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.detail || "Sınav gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{exam.title}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {exam.questions.length} Soru</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Süre sınırı yok</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* PDF İndirme Butonu (YENİ) */}
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {downloading ? (
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                 <Download className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">PDF İndir</span>
            </Button>

            <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
            >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Gönderiliyor..." : "Bitir"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 pb-32">
        {exam.questions.map((question, index) => (
          <Card key={question.id} className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <CardHeader className="bg-slate-900/50 border-b border-slate-800/50 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/20 flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {question.question_type === 'multiple_choice' ? 'Çoktan Seçmeli' :
                       question.question_type === 'true_false' ? 'Doğru/Yanlış' :
                       question.question_type === 'fill_blank' ? 'Boşluk Doldurma' :
                       question.question_type === 'image_based' ? 'Görsel Tabanlı' : 'Klasik'}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-slate-100 font-medium leading-relaxed">
                    {question.question_text}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              
              {/* Görsel Tabanlı Sorular İçin Resim */}
              {question.question_type === 'image_based' && question.image_data && (
                <div className="mb-6 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                  <img 
                    src={`data:image/jpeg;base64,${question.image_data}`}
                    alt="Soru görseli"
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              )}

              {/* Çoktan Seçmeli & Görsel Tabanlı (Native Input Çözümü) */}
              {(question.question_type === 'multiple_choice' || question.question_type === 'image_based') && (
                <div className="space-y-3">
                  {question.options?.map((option, optIdx) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <div key={optIdx} className="relative">
                        <input
                          type="radio"
                          name={question.id}
                          id={`${question.id}-${optIdx}`}
                          value={option}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor={`${question.id}-${optIdx}`} 
                          className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                              : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:bg-slate-800 hover:border-indigo-500/50'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-all
                            ${isSelected 
                              ? 'border-indigo-500 bg-indigo-500 text-white' 
                              : 'border-slate-600'
                            }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          <span className="text-sm font-medium">{option}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Doğru/Yanlış (Native Input Çözümü) */}
              {question.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((val) => {
                    const isSelected = answers[question.id] === val;
                    const isTrue = val === 'True';
                    return (
                      <div key={val} className="relative">
                        <input
                          type="radio"
                          name={question.id}
                          id={`${question.id}-${val}`}
                          value={val}
                          checked={isSelected}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="peer sr-only"
                        />
                        <Label 
                          htmlFor={`${question.id}-${val}`} 
                          className={`flex flex-col items-center justify-center p-6 rounded-xl border cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? (isTrue ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10')
                              : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800'
                            }
                            ${!isSelected && isTrue ? 'hover:border-emerald-500/50' : ''}
                            ${!isSelected && !isTrue ? 'hover:border-red-500/50' : ''}
                          `}
                        >
                          <span className={`text-lg font-bold ${
                            isSelected 
                              ? (isTrue ? 'text-emerald-400' : 'text-red-400')
                              : (isTrue ? 'text-emerald-400/70' : 'text-red-400/70')
                          }`}>
                            {isTrue ? 'Doğru' : 'Yanlış'}
                          </span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Boşluk Doldurma */}
              {question.question_type === 'fill_blank' && (
                <Input
                  placeholder="Cevabınızı buraya yazın..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-indigo-500 h-12 rounded-xl placeholder:text-slate-600"
                />
              )}

              {/* Klasik (Açık Uçlu) */}
              {question.question_type === 'open_ended' && (
                <Textarea
                  placeholder="Cevabınızı detaylı bir şekilde açıklayın..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-indigo-500 min-h-[150px] rounded-xl resize-none p-4 placeholder:text-slate-600"
                />
              )}

            </CardContent>
          </Card>
        ))}

        {/* Bottom Action */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full max-w-md h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-xl shadow-indigo-600/20 transition-all transform hover:scale-[1.02]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sınav Gönderiliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Sınavı Tamamla ve Gönder
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}