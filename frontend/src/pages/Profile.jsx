import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ArrowLeft, Save, User, Camera, Loader2, Sparkles, Shield } from "lucide-react";

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

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFullName(parsedUser.full_name);
      setPreview(parsedUser.avatar);
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      // Önizleme oluştur
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const token = localStorage.getItem("token");
      const response = await axios.put(`${API}/auth/update`, formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // LocalStorage'ı güncelle
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      toast.success("Profil başarıyla güncellendi!");
      
      // Biraz bekleyip dashboard'a dönelim
      setTimeout(() => navigate("/"), 1000);

    } catch (error) {
      console.error("Update error:", error);
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30 relative overflow-hidden flex items-center justify-center p-4">
      
      {/* Arka Plan Efektleri */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Card className="w-full max-w-lg border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")} 
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                Profil Ayarları
                <Sparkles className="w-5 h-5 text-purple-400" />
              </CardTitle>
              <CardDescription className="text-slate-400">
                Kişisel bilgilerinizi ve avatarınızı güncelleyin.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* Profil Resmi Alanı */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 shadow-xl bg-slate-800 flex items-center justify-center group-hover:border-purple-500/50 transition-all duration-300">
                  {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-500" />
                  )}
                </div>
                
                {/* Resim Yükleme Overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <Camera className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-300" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                
                {/* Online Status Dot */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
              </div>
              <p className="text-xs text-slate-500">Fotoğrafı değiştirmek için üzerine tıklayın</p>
            </div>

            <div className="space-y-6">
              {/* İsim Alanı */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="Adınız Soyadınız"
                    required
                  />
                </div>
              </div>

              {/* Email Alanı (Read Only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">E-posta</label>
                <div className="relative opacity-60">
                  <Shield className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-600 ml-1">* E-posta adresi güvenlik nedeniyle değiştirilemez.</p>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-600/25 transition-all mt-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  <span>Değişiklikleri Kaydet</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}