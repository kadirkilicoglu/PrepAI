

```markdown
# 🚀 PrepAI - Yapay Zeka Destekli Sınav Hazırlama Platformu

<img width="1919" height="883" alt="Ekran görüntüsü 2025-12-18 204858" src="https://github.com/user-attachments/assets/bf03cc9f-056a-4c10-84f2-47563291e407" />
<img width="1917" height="866" alt="Ekran görüntüsü 2025-12-18 204840" src="https://github.com/user-attachments/assets/096ae462-d278-4cee-8fb4-c1e68a68bbce" />
<img width="1919" height="878" alt="Ekran görüntüsü 2025-12-18 204828" src="https://github.com/user-attachments/assets/a154541f-0ad7-4457-afcd-75f0c23e4ba9" />
<img width="1919" height="871" alt="Ekran görüntüsü 2025-12-18 204713" src="https://github.com/user-attachments/assets/6a0fa346-88a2-42a4-8643-b75aad85a22f" />
<img width="1917" height="877" alt="Ekran görüntüsü 2025-12-18 204659" src="https://github.com/user-attachments/assets/b8f34f30-c0dd-461d-a918-63116184e7e2" />
<img width="1918" height="880" alt="Ekran görüntüsü 2025-12-18 204645" src="https://github.com/user-attachments/assets/291cb2eb-339b-4a10-8837-f8d013ed6dfa" />


PrepAI (arayüz adıyla **CogniScribe AI**), yüklediğiniz PDF ders notlarını analiz ederek Google Gemini AI desteğiyle otomatik sınavlar, konu özetleri ve detaylı başarı analizleri oluşturan modern bir web uygulamasıdır.


## ✨ Özellikler

* **📄 PDF Analizi:** Ders notlarını yükleyin, AI saniyeler içinde içeriği analiz etsin.
* **📝 Otomatik Sınav Üretimi:** * Çoktan Seçmeli
    * Doğru / Yanlış
    * Boşluk Doldurma
    * Klasik (Açık Uçlu)
    * Görsel Tabanlı Sorular
* **🎓 Akıllı Özet Çıkarıcı:** "Profesör Modu" ile ders notlarının kritik noktalarını özetleyin ve PDF olarak indirin.
* **📊 Detaylı Analiz:** Sınav sonuçlarınızı puan kartları, grafikler ve yapay zeka geri bildirimleriyle inceleyin.
* **🎨 Modern Arayüz:** Koyu mod (Dark Mode), neon efektler ve cam (glassmorphism) tasarımı.

## 🛠️ Teknolojiler

### Frontend (Arayüz)
* **React.js:** Kullanıcı arayüzü
* **Tailwind CSS:** Stil ve tasarım sistemi
* **Lucide React:** Modern ikon seti
* **Axios:** API istekleri
* **Sonner:** Şık bildirimler (Toast notifications)
* **jsPDF:** Özetleri PDF olarak indirme

### Backend (Sunucu)
* **Python & FastAPI:** Hızlı ve modern REST API
* **Google Gemini AI:** Üretken yapay zeka modeli
* **PyPDF2:** PDF işleme
* **Pydantic:** Veri doğrulama

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi bilgisayarınıza indirdikten sonra Backend ve Frontend'i ayrı terminallerde çalıştırmanız gerekir.

### 1. Projeyi Klonlayın
```bash
git clone [https://github.com/kadirkilicoglu/PrepAI.git](https://github.com/kadirkilicoglu/PrepAI.git)
cd PrepAI

```

### 2. Backend Kurulumu (Python)

```bash
cd backend

# Sanal ortam oluşturun (Önerilen)
python -m venv venv

# Sanal ortamı aktif edin
# Windows için:
.\venv\Scripts\activate
# Mac/Linux için:
source venv/bin/activate

# Gereksinimleri yükleyin
pip install -r requirements.txt

```

**API Anahtarı Ayarı:**
`backend` klasörü içinde `server.py` dosyasını açın ve `GOOGLE_API_KEY` değişkenine kendi Gemini API anahtarınızı girin veya bir `.env` dosyası oluşturarak oradan çekin.

**Backend'i Başlatın:**

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000

```

*Backend şu adreste çalışacak: `http://localhost:8000*`

### 3. Frontend Kurulumu (React)

Yeni bir terminal açın ve proje ana dizinine dönüp frontend klasörüne girin:

```bash
cd frontend

# Gerekli Node modüllerini yükleyin
npm install

# (Opsiyonel) Eğer hata alırsanız şu komutu deneyin:
# npm install --legacy-peer-deps

```

**Çevre Değişkenleri:**
Frontend klasöründe `.env` adında bir dosya oluşturun ve içine şunu yazın:

```env
REACT_APP_BACKEND_URL=http://localhost:8000

```

**Frontend'i Başlatın:**

```bash
npm start

```

*Uygulama tarayıcınızda şu adreste açılacak: `http://localhost:3000*`

---

## 📂 Proje Yapısı

```
PrepAI/
├── backend/            # FastAPI Sunucusu
│   ├── server.py       # Ana uygulama dosyası
│   ├── venv/           # Python sanal ortamı
│   └── requirements.txt
│
└── frontend/           # React Uygulaması
    ├── public/
    ├── src/
    │   ├── components/ # UI Bileşenleri (Button, Card, Input vb.)
    │   ├── pages/      # Sayfalar (Dashboard, Exam, Summary vb.)
    │   ├── App.js      # Ana Rota Yapılandırması
    │   └── index.css   # Tailwind ve Global Stiller
    └── package.json

```

## 📞 İletişim

**Geliştirici:** Abdulkadir Kılıçoğlu

**GitHub:** [https://github.com/kadirkilicoglu](https://github.com/kadirkilicoglu)



