import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv('.env')
api_key = os.getenv("GOOGLE_AI_KEY")
genai.configure(api_key=api_key)

print("🔍 Mevcut modeller listeleniyor...\n")

try:
    # Google'dan senin anahtarınla erişilebilen modelleri iste
    models = genai.list_models()
    found_any = False
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Kullanılabilir Model: {m.name}")
            found_any = True
    
    if not found_any:
        print("❌ Hiçbir model bulunamadı! API Anahtarı hatalı veya yetkisiz olabilir.")
    else:
        print("\n🎉 Listeleme başarılı! Yukarıdaki isimlerden birini server.py dosyasına yazacağız.")

except Exception as e:
    print(f"❌ HATA OLUŞTU: {e}")