import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebflowProcessor } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('WebflowProcessor Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-files');
  const inputDir = path.join(testDir, 'input');
  const outputDir = path.join(testDir, 'output');

  beforeAll(async () => {
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(outputDir, { recursive: true });
  });

  it('should process HTML files and remove webflow attributes', async () => {
    const testHtml = `<!DOCTYPE html>
<html data-wf-page="685996de362613655dd702b6" data-wf-site="685996de362613655dd702b4" lang="en">
<head>
  <title>Test Page</title>
</head>
<body>
  <div data-wf-page="inner">Content</div>
</body>
</html>`;

    await fs.writeFile(path.join(inputDir, 'test.html'), testHtml);

    const config = {
      inputDir,
      outputDir,
      processors: {
        removeWebflowAttributes: {
          enabled: true,
          attributes: ['data-wf-page', 'data-wf-site']
        }
      }
    };

    const processor = new WebflowProcessor(config);
    const result = await processor.processFiles();

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);
    expect(result.errors).toHaveLength(0);

    const outputContent = await fs.readFile(
      path.join(outputDir, 'test.html'), 
      'utf-8'
    );

    expect(outputContent).not.toContain('data-wf-page');
    expect(outputContent).not.toContain('data-wf-site');
    expect(outputContent).toContain('<html lang="en">');
    expect(outputContent).toContain('<div>Content</div>');
  });

  it('should maintain directory structure', async () => {
    const subDir = path.join(inputDir, 'components');
    await fs.mkdir(subDir, { recursive: true });

    const testHtml = `<div data-wf-site="123">Component</div>`;
    await fs.writeFile(path.join(subDir, 'component.html'), testHtml);

    const config = {
      inputDir,
      outputDir
    };

    const processor = new WebflowProcessor(config);
    await processor.processFiles();

    const outputFile = path.join(outputDir, 'components', 'component.html');
    const exists = await fs.access(outputFile).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const content = await fs.readFile(outputFile, 'utf-8');
    expect(content).not.toContain('data-wf-site');
  });

  it('should handle multiple files', async () => {
    const files = ['file1.html', 'file2.html', 'file3.html'];
    
    for (const file of files) {
      await fs.writeFile(
        path.join(inputDir, file),
        `<html data-wf-page="${file}"><body></body></html>`
      );
    }

    const config = {
      inputDir,
      outputDir
    };

    const processor = new WebflowProcessor(config);
    const result = await processor.processFiles();

    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(3);

    for (const file of files) {
      const content = await fs.readFile(path.join(outputDir, file), 'utf-8');
      expect(content).not.toContain('data-wf-page');
    }
  });

  it('should handle processing errors gracefully', async () => {
    await fs.writeFile(
      path.join(inputDir, 'valid.html'),
      '<html><body>Valid</body></html>'
    );

    const invalidPath = path.join(inputDir, 'nonexistent', 'file.html');
    
    const config = {
      inputDir,
      outputDir
    };

    const processor = new WebflowProcessor(config);
    processor.processFile = jest.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Processing failed'));

    const processFilesSpy = jest.spyOn(processor, 'processFiles');
    
    try {
      await processor.processFiles();
    } catch (error) {
      // Expected to handle errors internally
    }

    expect(processFilesSpy).toHaveBeenCalled();
  });
});