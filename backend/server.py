from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import tempfile
from PyPDF2 import PdfReader
import google.generativeai as genai
from pdf2image import convert_from_path
from PIL import Image
import base64
import io
import random
import json
import warnings

# Gereksiz uyarıları gizle
warnings.filterwarnings("ignore", category=FutureWarning)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "exam-generator-secret-key-2025")
ALGORITHM = "HS256"
security = HTTPBearer()

# Google AI Key
GOOGLE_AI_KEY = os.environ.get("GOOGLE_AI_KEY")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_text: str
    question_type: Literal["multiple_choice", "true_false", "fill_blank", "open_ended", "image_based"]
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    image_data: Optional[str] = None

class ExamCreate(BaseModel):
    exam_type: Literal["multiple_choice", "true_false", "fill_blank", "open_ended", "image_based", "mixed"]
    difficulty: Literal["easy", "medium", "hard"]
    num_questions: int = Field(ge=5, le=50)

class Exam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    exam_type: str
    difficulty: str
    questions: List[Question]
    pdf_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExamAnswer(BaseModel):
    question_id: str
    user_answer: str

class ExamSubmission(BaseModel):
    exam_id: str
    answers: List[ExamAnswer]

class ExamResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_id: str
    user_id: str
    score: float
    total_questions: int
    correct_answers: int
    answers: List[ExamAnswer]
    feedback: List[dict]
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Summary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def _pil_image_to_base64(img: Image.Image) -> str:
    max_size = 1024
    img = img.convert("RGB")
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode()

def _extract_images_with_pdf2image(pdf_path: str, target_count: int) -> List[dict]:
    try:
        pages = convert_from_path(pdf_path, dpi=200, fmt="jpeg")
        if not pages: return []
        if len(pages) < target_count: return []
        selected_indices = random.sample(range(len(pages)), target_count)
        extracted = []
        for page_index in selected_indices:
            extracted.append({"page_index": page_index, "image_data": _pil_image_to_base64(pages[page_index])})
        return extracted
    except Exception as e:
        logging.error(f"Error extracting images: {str(e)}")
        return []

def extract_images_from_pdf(pdf_path: str, target_count: int) -> List[dict]:
    if target_count <= 0: raise HTTPException(status_code=400, detail="Positive count required")
    try:
        import fitz
        doc = fitz.open(pdf_path)
        try:
            total_pages = len(doc)
            if total_pages < target_count: raise HTTPException(status_code=400, detail="Not enough pages")
            selected_indices = random.sample(range(total_pages), target_count)
            zoom_matrix = fitz.Matrix(2.0, 2.0)
            extracted = []
            for page_index in selected_indices:
                page = doc[page_index]
                pix = page.get_pixmap(matrix=zoom_matrix)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                extracted.append({"page_index": page_index, "image_data": _pil_image_to_base64(img)})
            return extracted
        finally:
            doc.close()
    except Exception:
        images = _extract_images_with_pdf2image(pdf_path, target_count)
        if not images: raise HTTPException(status_code=500, detail="Image extraction failed")
        return images

def get_random_pdf_sections(pdf_text: str, num_sections: int = 3) -> str:
    paragraphs = [p.strip() for p in pdf_text.split('\n\n') if p.strip()]
    if len(paragraphs) <= num_sections: return pdf_text
    selected_paragraphs = random.sample(paragraphs, min(num_sections, len(paragraphs)))
    return '\n\n'.join(selected_paragraphs)

async def generate_image_based_exam(pdf_path: str, difficulty: str, num_questions: int) -> List[Question]:
    try:
        images = extract_images_from_pdf(pdf_path, num_questions)
        genai.configure(api_key=GOOGLE_AI_KEY)
        difficulty_tr = {"easy": "kolay", "medium": "orta", "hard": "zor"}.get(difficulty, difficulty)
        questions = []
        model_names = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']
        
        for idx, page_image in enumerate(images):
            prompt = f"""Sen uzman bir sınavcısın. Görseli analiz et ve {difficulty_tr} seviyesinde 1 görsel tabanlı çoktan seçmeli soru üret.
            JSON formatında: {{"question_text": "...", "question_type": "image_based", "options": ["A...", "B...", "C...", "D...", "E..."], "correct_answer": "A", "explanation": "..."}}"""
            
            response_text = None
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    res = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": page_image["image_data"]}])
                    response_text = res.text.strip()
                    break
                except: continue
            
            if not response_text: raise HTTPException(status_code=500, detail="AI generation failed")
            if response_text.startswith("```"): response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0]
            try: q_data = json.loads(response_text)
            except: q_data = json.loads(response_text.replace("```json", "").replace("```", "").strip())
            
            if isinstance(q_data, list): q_data = q_data[0]
            questions.append(Question(**q_data, image_data=page_image["image_data"]))
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image exam error: {str(e)}")

async def generate_exam_with_ai(pdf_text: str, exam_type: str, difficulty: str, num_questions: int) -> List[Question]:
    try:
        genai.configure(api_key=GOOGLE_AI_KEY)
        
        # --- ÖZELLEŞTİRİLMİŞ TALİMATLAR ---
        type_instruction = {
            "multiple_choice": {
                "instruction": "Çoktan seçmeli sorular oluştur. 'options' listesinde 5 seçenek (A,B,C,D,E) olsun. Doğru cevabı sadece harf olarak (örn: 'A') belirt.",
                "question_type": "multiple_choice"
            },
            "true_false": {
                "instruction": "Doğru/Yanlış soruları oluştur. Soru bir yargı cümlesi olsun. 'options' listesi HER ZAMAN ['Doğru', 'Yanlış'] olsun. Doğru cevap 'Doğru' veya 'Yanlış' olsun.",
                "question_type": "true_false"
            },
            "fill_blank": {
                "instruction": "Boşluk doldurma soruları oluştur. Soru metninde boş bırakılan yeri '__________' ile göster. 'options' listesini BOŞ bırak ([]). 'correct_answer' kısmına sadece boşluğa gelecek kelimeyi/kelimeleri yaz.",
                "question_type": "fill_blank"
            },
            "open_ended": {
                "instruction": "Klasik (açık uçlu) sorular oluştur. Düşünmeye ve açıklamaya dayalı sorular olsun. 'options' listesini BOŞ bırak ([]). 'correct_answer' kısmına örnek ideal cevabı yaz.",
                "question_type": "open_ended"
            },
            "mixed": {
                "instruction": "Karışık türde sorular oluştur: Listede rastgele olarak 'multiple_choice', 'true_false', 'fill_blank' ve 'open_ended' türleri olsun. Her sorunun türüne göre yukarıdaki kurallara uy.",
                "question_type": "mixed"
            }
        }
        
        diff_tr = {"easy": "kolay", "medium": "orta", "hard": "zor"}.get(difficulty, difficulty)
        exam_instruction = type_instruction[exam_type]
        content = get_random_pdf_sections(pdf_text, 5)
        
        prompt = f"""Sen uzman bir sınavcısın. Aşağıdaki içerikten {num_questions} adet {diff_tr} seviyesinde soru üret.
        
        Soru Türü Talimatı: {exam_instruction["instruction"]}
        
        İçerik: {content[:4000]}
        
        ÖNEMLİ: Cevabın SADECE aşağıdaki JSON formatında bir liste olsun:
        [
          {{
            "question_text": "Soru metni...",
            "question_type": "{exam_instruction['question_type'] if exam_type != 'mixed' else 'sorunun_turu'}",
            "options": ["Seçenek1", "Seçenek2"...] veya [],
            "correct_answer": "Cevap",
            "explanation": "Açıklama"
          }}
        ]
        
        JSON dışında hiçbir metin yazma.
        """
        
        response_text = None
        for model_name in ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']:
            try:
                model = genai.GenerativeModel(model_name)
                res = model.generate_content(prompt)
                response_text = res.text.strip()
                break
            except: continue
            
        if not response_text: raise HTTPException(status_code=500, detail="AI generation failed")
        if response_text.startswith("```"): response_text = response_text.split("\n", 1)[1].rsplit("```", 1)[0]
        try: q_data = json.loads(response_text)
        except: q_data = json.loads(response_text.replace("```json", "").replace("```", "").strip())
        
        # --- TİP DÜZELTME VE STANDARTLAŞTIRMA ---
        for q in q_data:
            if "question_type" in q:
                q["question_type"] = q["question_type"].replace("-", "_")
            if q["question_type"] == "true_false":
                q["options"] = ["Doğru", "Yanlış"]
            if q["question_type"] in ["fill_blank", "open_ended"]:
                q["options"] = []

        return [Question(**q) for q in q_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text exam error: {str(e)}")

async def evaluate_answer_with_ai(q_text, c_ans, u_ans, q_type) -> bool:
    try:
        if u_ans.strip().lower() == c_ans.strip().lower(): return True
        if q_type == "multiple_choice":
            u, c = u_ans.strip().upper(), c_ans.strip().upper()
            if (len(c) == 1 and u.startswith(c + ".")) or (len(u) == 1 and c.startswith(u + ".")): return True
            
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Soru: {q_text}
        Doğru Cevap: {c_ans}
        Öğrenci Cevabı: {u_ans}
        Sadece JSON formatında cevap ver: {{ "is_correct": true/false }}
        """
        res = model.generate_content(prompt)
        text = res.text.strip()
        if text.startswith("```"): text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text).get("is_correct", False)
    except: return u_ans.strip().lower() == c_ans.strip().lower()

# --- ROUTES ---
@api_router.post("/auth/register", response_model=dict)
async def register(ud: UserCreate):
    if await db.users.find_one({"email": ud.email}): raise HTTPException(400, "Email registered")
    user = User(email=ud.email, full_name=ud.full_name)
    doc = user.model_dump(); doc["password_hash"] = hash_password(ud.password); doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)
    return {"token": create_access_token({"sub": user.id}), "user": user.model_dump()}

@api_router.post("/auth/login", response_model=dict)
async def login(c: UserLogin):
    u = await db.users.find_one({"email": c.email}, {"_id": 0})
    if not u or not verify_password(c.password, u["password_hash"]): raise HTTPException(401, "Invalid credentials")
    return {"token": create_access_token({"sub": u["id"]}), "user": u}

@api_router.put("/auth/update", response_model=User)
async def update_profile(full_name: str = Form(...), avatar: UploadFile = File(None), cu: dict = Depends(get_current_user)):
    upd = {"full_name": full_name}
    if avatar:
        try:
            img = Image.open(io.BytesIO(await avatar.read())).convert("RGB")
            img.thumbnail((300, 300))
            buf = io.BytesIO(); img.save(buf, format="JPEG", quality=70)
            upd["avatar"] = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
        except: raise HTTPException(400, "Image error")
    await db.users.update_one({"id": cu["id"]}, {"$set": upd})
    return await db.users.find_one({"id": cu["id"]}, {"_id": 0})

@api_router.post("/exams/create", response_model=Exam)
async def create_exam(pdf: UploadFile = File(...), exam_type: str = Form("mixed"), difficulty: str = Form("medium"), num_questions: int = Form(10), cu: dict = Depends(get_current_user)):
    if not pdf.filename.endswith('.pdf'): raise HTTPException(400, "PDF only")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await pdf.read()); tmp_path = tmp.name
    try:
        qs = await generate_image_based_exam(tmp_path, difficulty, num_questions) if exam_type == "image_based" else await generate_exam_with_ai(extract_text_from_pdf(tmp_path), exam_type, difficulty, num_questions)
        exam = Exam(user_id=cu["id"], title=f"Exam from {pdf.filename}", exam_type=exam_type, difficulty=difficulty, questions=qs, pdf_name=pdf.filename)
        doc = exam.model_dump(); doc["created_at"] = doc["created_at"].isoformat(); doc["questions"] = [q.model_dump() for q in qs]
        await db.exams.insert_one(doc)
        return exam
    finally: os.unlink(tmp_path)

@api_router.post("/summarize")
async def summarize_pdf_endpoint(pdf: UploadFile = File(...), cu: dict = Depends(get_current_user)):
    if not pdf.filename.endswith('.pdf'): raise HTTPException(400, "Only PDF")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await pdf.read()); tmp_path = tmp.name
    try:
        text = extract_text_from_pdf(tmp_path)
        if not text.strip(): raise HTTPException(400, "No text in PDF")
        
        genai.configure(api_key=GOOGLE_AI_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""Sen bu dersin uzmanı, kıdemli bir profesörsün. Öğrencilerin için aşağıdaki ders notlarını özetle.
        Kurallar:
        1. Akademik ama samimi ve anlaşılır bir dil kullan.
        2. Ana kavramları, tanımları ve kritik noktaları maddeler halinde vurgula.
        3. Konuyu bölümlere ayır ve başlıklar kullan.
        4. Türkçe konuş.
        İçerik: {text[:20000]}"""
        
        res = model.generate_content(prompt)
        summary_text = res.text
        
        summary_obj = Summary(
            user_id=cu["id"],
            title=f"Özet: {pdf.filename}",
            content=summary_text
        )
        
        summary_doc = summary_obj.model_dump()
        summary_doc["created_at"] = summary_doc["created_at"].isoformat()
        await db.summaries.insert_one(summary_doc)
        return {"summary": summary_text, "id": summary_obj.id}
    except Exception as e:
        logging.error(f"Summarize error: {e}")
        raise HTTPException(500, f"Summary failed: {str(e)}")
    finally: os.unlink(tmp_path)

@api_router.get("/summaries", response_model=List[Summary])
async def get_summaries(cu: dict = Depends(get_current_user)):
    summaries = await db.summaries.find({"user_id": cu["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for s in summaries:
        if isinstance(s["created_at"], str): s["created_at"] = datetime.fromisoformat(s["created_at"])
    return summaries

# --- YENİ EKLENEN TEKİL ÖZET GETİRME FONKSİYONU ---
@api_router.get("/summaries/{summary_id}", response_model=Summary)
async def get_summary(summary_id: str, current_user: dict = Depends(get_current_user)):
    summary = await db.summaries.find_one({"id": summary_id, "user_id": current_user["id"]}, {"_id": 0})
    if not summary:
        raise HTTPException(status_code=404, detail="Özet bulunamadı")
    if isinstance(summary["created_at"], str):
        summary["created_at"] = datetime.fromisoformat(summary["created_at"])
    return summary

@api_router.get("/exams", response_model=List[Exam])
async def get_exams(cu: dict = Depends(get_current_user)):
    exams = await db.exams.find({"user_id": cu["id"]}, {"_id": 0}).to_list(1000)
    for e in exams: 
        if isinstance(e["created_at"], str): e["created_at"] = datetime.fromisoformat(e["created_at"])
    return exams

@api_router.get("/exams/{eid}", response_model=Exam)
async def get_exam(eid: str, cu: dict = Depends(get_current_user)):
    e = await db.exams.find_one({"id": eid, "user_id": cu["id"]}, {"_id": 0})
    if not e: raise HTTPException(404, "Not found")
    if isinstance(e["created_at"], str): e["created_at"] = datetime.fromisoformat(e["created_at"])
    return e

@api_router.delete("/exams/{eid}")
async def delete_exam(eid: str, cu: dict = Depends(get_current_user)):
    if (await db.exams.delete_one({"id": eid, "user_id": cu["id"]})).deleted_count == 0: raise HTTPException(404, "Not found")
    await db.exam_results.delete_many({"exam_id": eid})
    return {"msg": "Deleted"}

@api_router.post("/exams/submit", response_model=ExamResult)
async def submit_exam(sub: ExamSubmission, cu: dict = Depends(get_current_user)):
    e = await db.exams.find_one({"id": sub.exam_id, "user_id": cu["id"]}, {"_id": 0})
    if not e: raise HTTPException(404, "Not found")
    correct, fb = 0, []
    for ans in sub.answers:
        q = next((x for x in e["questions"] if x["id"] == ans.question_id), None)
        if q:
            is_c = await evaluate_answer_with_ai(q["question_text"], q["correct_answer"], ans.user_answer, q["question_type"])
            if is_c: correct += 1
            fb.append({"question_id": ans.question_id, "is_correct": is_c, "correct_answer": q["correct_answer"], "user_answer": ans.user_answer, "explanation": q.get("explanation", "")})
    res = ExamResult(exam_id=sub.exam_id, user_id=cu["id"], score=(correct/len(e["questions"]))*100 if e["questions"] else 0, total_questions=len(e["questions"]), correct_answers=correct, answers=sub.answers, feedback=fb)
    doc = res.model_dump(); doc["submitted_at"] = doc["submitted_at"].isoformat(); doc["answers"] = [a.model_dump() for a in sub.answers]
    await db.exam_results.insert_one(doc)
    return res

@api_router.get("/results", response_model=List[ExamResult])
async def get_results(cu: dict = Depends(get_current_user)):
    res = await db.exam_results.find({"user_id": cu["id"]}, {"_id": 0}).to_list(1000)
    for r in res: 
        if isinstance(r["submitted_at"], str): r["submitted_at"] = datetime.fromisoformat(r["submitted_at"])
    return res

@api_router.get("/results/{rid}", response_model=ExamResult)
async def get_result(rid: str, cu: dict = Depends(get_current_user)):
    r = await db.exam_results.find_one({"id": rid, "user_id": cu["id"]}, {"_id": 0})
    if not r: raise HTTPException(404, "Not found")
    if isinstance(r["submitted_at"], str): r["submitted_at"] = datetime.fromisoformat(r["submitted_at"])
    return r

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
@app.on_event("shutdown")
async def shutdown(): client.close()