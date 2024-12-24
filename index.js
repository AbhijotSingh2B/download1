// Next.js application to implement a file-sharing platform

// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const file = e.target.fileInput.files[0];

    if (!file) return;

    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setUploadedFiles((prev) => [...prev, data.filePath]);
    } catch (error) {
      console.error(error);
      alert('File upload failed');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1>File Sharing Platform</h1>

      <form onSubmit={handleUpload}>
        <input type="file" name="fileInput" required />
        <button type="submit">Upload</button>
      </form>

      <h2>Uploaded Files</h2>
      <ul>
        {uploadedFiles.map((filePath, index) => (
          <li key={index}>
            <a href={filePath} download>
              {filePath.split('/').pop()}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// pages/api/upload.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const boundary = req.headers['content-type'].split('boundary=')[1];
      const buffer = Buffer.concat(chunks);
      const parts = buffer.toString().split(`--${boundary}`);

      const contentDisposition = parts[1].split('\r\n')[1];
      const fileName = contentDisposition.match(/filename="(.+?)"/)[1];
      const fileData = parts[1].split('\r\n\r\n')[1].split('\r\n--')[0];

      const uploadDir = path.join(process.cwd(), 'public/uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, fileData, 'binary');

      res.status(200).json({ filePath: `/uploads/${fileName}` });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
