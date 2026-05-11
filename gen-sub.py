import whisper
from whisper.utils import get_writer
import time
import ssl

# ปลดล็อค SSL
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

def generate_vtt(video_path):
    print("กำลังเตรียม AI ถอดเสียง...")
    model = whisper.load_model("base")
    
    print(f"เริ่มถอดเสียงวิดีโอ: {video_path}")
    start_time = time.time()
    result = model.transcribe(video_path, language="th")
    
    # สั่งให้เซฟไฟล์ .vtt ไปเก็บไว้ในโฟลเดอร์ public/subtitles/ อัตโนมัติ
    vtt_writer = get_writer("vtt", "public/subtitles/")
    vtt_writer(result, video_path)
    
    end_time = time.time()
    print(f"✅ สร้างไฟล์ซับไตเติลสำเร็จ! ใช้เวลาไป {round(end_time - start_time, 2)} วินาที")

if __name__ == "__main__":
    # ชี้เป้าไปที่คลิปในโฟลเดอร์ให้ถูกต้อง
    video_file = "public/videos/ตัวอย่างนำเสนอ.mp4" 
    generate_vtt(video_file)