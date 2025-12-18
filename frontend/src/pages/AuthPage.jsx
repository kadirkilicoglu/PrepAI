import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Brain, Target, Zap, Lock, Mail, User } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

export default function AuthPage({ setIsAuthenticated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Giriş başarılı!");
      setIsAuthenticated(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Kayıt başarılı!");
      setIsAuthenticated(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f172a] text-slate-200 relative overflow-hidden">
      
      {/* Arka Plan Efektleri */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 p-6 items-center relative z-10">
        
        {/* Sol Taraf - Marka & Bilgi */}
        <div className="space-y-8 lg:pr-12">
          <div className="inline-flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-400">Yapay Zeka Destekli Sınav Hazırlama</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Sınavlarınızı <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Geleceğe Taşıyın
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              PDF dosyalarınızı yükleyin, yapay zeka saniyeler içinde analiz etsin ve size özel interaktif sınavlar oluştursun.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Akıllı Analiz</h3>
                <p className="text-sm text-slate-400">İçeriği anlayan derin öğrenme modelleri</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Kişiselleştirilmiş Sorular</h3>
                <p className="text-sm text-slate-400">Seviyenize uygun zorluk ayarı</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Hızlı Sonuçlar</h3>
                <p className="text-sm text-slate-400">Anında değerlendirme ve geri bildirim</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Taraf - Form */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-indigo-500/10 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">PrepAI</h2>
              <p className="text-slate-400 text-sm mt-1">Hesabınıza giriş yapın</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg text-slate-400 transition-all"
                >
                  Giriş Yap
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg text-slate-400 transition-all"
                >
                  Kayıt Ol
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-300 ml-1">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 ml-1">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : "Giriş Yap"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-300 ml-1">Ad Soyad</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Input
                        type="text"
                        placeholder="Adınız Soyadınız"
                        className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 ml-1">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 ml-1">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : "Hesap Oluştur"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}