// pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'uploads');

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) {
        return res.status(500).json({ message: 'File upload failed', error: err });
      }
      const file = files.file as formidable.File;
      const filePath = file.filepath;
      const fileName = file.originalFilename;

      // Optionally, move the file to another directory
      const newFilePath = path.join(uploadDir, fileName as string);
      fs.rename(filePath, newFilePath, (renameErr) => {
        if (renameErr) {
          return res.status(500).json({ message: 'File rename failed', error: renameErr });
        }
        res.status(200).json({ message: 'File uploaded successfully' });
      });
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};

export default handler;
