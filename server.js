// server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API สำหรับดาวน์โหลดวิดีโอจาก Facebook
app.get('/api/facebook', (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'กรุณาระบุ URL ของวิดีโอ' });
  }

  // สั่ง yt-dlp ดึงข้อมูลความละเอียด
  const cmd = `yt-dlp -j "${videoUrl}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลวิดีโอ:', stderr);
      return res.status(500).json({ error: 'ไม่สามารถดึงวิดีโอได้' });
    }

    try {
      const data = JSON.parse(stdout);
      const formats = data.formats
        .filter(f => f.acodec !== 'none' && f.vcodec !== 'none' && f.url)
        .map(f => ({
          url: f.url,
          quality: f.format_note || f.height + 'p',
          ext: f.ext
        }));

      res.json({ title: data.title, thumbnail: data.thumbnail, formats });
    } catch (parseError) {
      console.error('ไม่สามารถแปลง JSON ได้:', parseError);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแปลงข้อมูล' });
    }
  });
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
