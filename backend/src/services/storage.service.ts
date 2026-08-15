import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../config/logger';

export class StorageService {
  public static async saveFile(file: Express.Multer.File, subfolder = ''): Promise<string> {
    const destinationFolder = path.join(config.storagePath, subfolder);
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }

    const relativePath = path.join('/uploads', subfolder, file.filename).replace(/\\/g, '/');
    logger.info(`Saved file to ${relativePath}`);
    return relativePath;
  }

  public static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl) return false;
      const cleanPath = fileUrl.replace('/uploads', '');
      const absolutePath = path.join(config.storagePath, cleanPath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error(`Error deleting file ${fileUrl}: ${error.message}`);
      return false;
    }
  }
}
