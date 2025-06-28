// File: api/facebook.js
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.includes('facebook.com')) {
    return res.status(400).json({ error: 'ลิงก์ Facebook ไม่ถูกต้อง' });
  }

  try {
    const command = `yt-dlp -j "${url}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('เกิดข้อผิดพลาด:', stderr || error.message);
        return res.status(500).json({ error: 'ไม่สามารถดึงวิดีโอได้' });
      }

      try {
        const data = JSON.parse(stdout);
        const formats = data.formats
          .filter(f => f.ext === 'mp4' && f.height)
          .map(f => ({
            url: f.url,
            quality: f.format_note || `${f.height}p`,
            ext: f.ext,
            size: f.filesize ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB` : 'ไม่ทราบขนาด'
          }));

        res.status(200).json({
          title: data.title,
          thumbnail: data.thumbnail,
          formats
        });

      } catch (parseError) {
        console.error('แปลงข้อมูลไม่ได้:', parseError);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแปลงข้อมูลวิดีโอ' });
      }
    });

  } catch (err) {
    console.error('ระบบขัดข้อง:', err);
    res.status(500).json({ error: 'เซิร์ฟเวอร์มีปัญหา' });
  }
}
