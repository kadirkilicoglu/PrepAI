import os
from dotenv import load_dotenv
import google.generativeai as genai
import time

load_dotenv('.env')
api_key = os.getenv("GOOGLE_AI_KEY")
genai.configure(api_key=api_key)

# Server.py içinde kullandığımız modeller
models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

print(f"🔑 API Anahtarı: {api_key[:5]}... (Okundu)")
print("🚀 Soru üretme testi başlıyor...\n")

for model_name in models:
    print(f"--------------------------------------------------")
    print(f"📡 Model Deneniyor: {model_name}")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Bana 'Merhaba' de.")
        
        if response.text:
            print(f"✅ BAŞARILI! Cevap geldi: {response.text.strip()}")
            print(f"🌟 SONUÇ: Server.py dosyasında '{model_name}' kullanmalısın!")
            break # Biri çalışsa yeter
        else:
            print("⚠️ Cevap boş döndü.")
            
    except Exception as e:
        print(f"❌ HATA: {e}")
        # Hata mesajı içinde '429' veya 'Quota' geçiyor mu?
        if "429" in str(e) or "Quota" in str(e):
            print("🚨 KOTA DOLMUŞ! (429 Resource Exhausted)")
            print("Çözüm: Yeni bir Google hesabı ile yeni API Key almalısın.")

print("\n--------------------------------------------------")
print("Test tamamlandı.")