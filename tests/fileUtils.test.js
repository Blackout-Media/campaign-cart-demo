import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { 
  ensureDirectoryExists, 
  findFiles, 
  readFile, 
  writeFile, 
  getRelativePath,
  getOutputPath 
} from '../src/utils/fileUtils.js';

jest.mock('fs/promises');
jest.mock('glob');

describe('fileUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory successfully', async () => {
      fs.mkdir.mockResolvedValue(undefined);
      
      await ensureDirectoryExists('/test/dir');
      
      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should throw error when mkdir fails', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(ensureDirectoryExists('/test/dir'))
        .rejects.toThrow('Failed to create directory /test/dir: Permission denied');
    });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      fs.readFile.mockResolvedValue('<html>content</html>');
      
      const content = await readFile('/test/file.html');
      
      expect(content).toBe('<html>content</html>');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.html', 'utf-8');
    });

    it('should throw error when file read fails', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(readFile('/test/missing.html'))
        .rejects.toThrow('Failed to read file /test/missing.html: File not found');
    });
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);
      
      await writeFile('/test/output/file.html', '<html>processed</html>');
      
      expect(fs.mkdir).toHaveBeenCalledWith('/test/output', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/output/file.html', 
        '<html>processed</html>', 
        'utf-8'
      );
    });

    it('should throw error when file write fails', async () => {
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockRejectedValue(new Error('Disk full'));
      
      await expect(writeFile('/test/file.html', 'content'))
        .rejects.toThrow('Failed to write file /test/file.html: Disk full');
    });
  });

  describe('path utilities', () => {
    it('should get relative path correctly', () => {
      const result = getRelativePath('/base/dir', '/base/dir/sub/file.html');
      expect(result).toBe(path.join('sub', 'file.html'));
    });

    it('should get output path correctly', () => {
      const result = getOutputPath(
        '/project/import/components/test.html',
        '/project/import',
        '/project/dist'
      );
      expect(result).toBe(path.join('/project/dist', 'components', 'test.html'));
    });
  });
});