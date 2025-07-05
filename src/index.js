import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { config as defaultConfig } from './config.js';
import { HtmlProcessor } from './processors/htmlProcessor.js';
import { findFiles, readFile, writeFile, getOutputPath, ensureDirectoryExists } from './utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebflowProcessor {
  constructor(config) {
    this.config = { ...defaultConfig, ...config };
    this.htmlProcessor = new HtmlProcessor(this.config);
  }

  async processFiles() {
    const startTime = Date.now();
    console.log('🚀 Starting Webflow HTML processing...');
    
    try {
      const inputPath = path.resolve(this.config.inputDir);
      const outputPath = path.resolve(this.config.outputDir);
      
      console.log(`📁 Input directory: ${inputPath}`);
      console.log(`📁 Output directory: ${outputPath}`);
      
      // Copy assets if enabled
      if (this.config.copyAssets?.enabled) {
        await this.copyAssets(inputPath, outputPath);
      }
      
      const htmlFiles = await findFiles(this.config.filePatterns.html, inputPath);
      console.log(`📄 Found ${htmlFiles.length} HTML files to process`);

      let processedCount = 0;
      const errors = [];

      for (const file of htmlFiles) {
        try {
          await this.processFile(file, inputPath, outputPath);
          processedCount++;
          console.log(`✅ Processed: ${path.relative(inputPath, file)}`);
        } catch (error) {
          errors.push({ file, error: error.message });
          console.error(`❌ Failed to process ${file}: ${error.message}`);
        }
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n📊 Processing Summary:');
      console.log(`✅ Successfully processed: ${processedCount} files`);
      console.log(`❌ Failed: ${errors.length} files`);
      console.log(`⏱️  Total time: ${duration}s`);

      if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(({ file, error }) => {
          console.log(`  - ${path.relative(inputPath, file)}: ${error}`);
        });
      }

      return {
        success: errors.length === 0,
        processedCount,
        errors,
        duration
      };
    } catch (error) {
      console.error(`❌ Fatal error: ${error.message}`);
      throw error;
    }
  }

  async processFile(filePath, inputDir, outputDir) {
    const content = await readFile(filePath);
    const processedContent = await this.htmlProcessor.process(content);
    const outputPath = getOutputPath(filePath, inputDir, outputDir);
    await writeFile(outputPath, processedContent);
  }

  async copyAssets(inputDir, outputDir) {
    console.log('\n📦 Copying assets...');
    
    try {
      // Copy folders from import to dist
      for (const folder of this.config.copyAssets.folders) {
        const sourcePath = path.join(inputDir, folder);
        const destPath = path.join(outputDir, folder);
        
        try {
          const stats = await fs.stat(sourcePath);
          if (stats.isDirectory()) {
            await this.copyDirectory(sourcePath, destPath);
            console.log(`✅ Copied ${folder} folder`);
          }
        } catch (error) {
          console.log(`⚠️  Skipping ${folder} folder (not found)`);
        }
      }
      
      // Copy custom files
      for (const customFile of this.config.copyAssets.customFiles) {
        const sourcePath = path.resolve(customFile.from);
        const destPath = path.join(outputDir, customFile.to);
        
        try {
          await ensureDirectoryExists(path.dirname(destPath));
          await fs.copyFile(sourcePath, destPath);
          console.log(`✅ Copied ${customFile.to}`);
        } catch (error) {
          console.error(`❌ Failed to copy ${customFile.from}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`❌ Asset copying error: ${error.message}`);
    }
  }

  async copyDirectory(source, destination) {
    await ensureDirectoryExists(destination);
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      describe: 'Input directory containing HTML files',
      default: 'import'
    })
    .option('output', {
      alias: 'o',
      describe: 'Output directory for processed files',
      default: 'dist'
    })
    .option('config', {
      alias: 'c',
      describe: 'Path to custom configuration file'
    })
    .help()
    .argv;

  let customConfig = {};
  
  if (argv.config) {
    try {
      const configPath = path.resolve(argv.config);
      customConfig = (await import(configPath)).default;
    } catch (error) {
      console.error(`❌ Failed to load config file: ${error.message}`);
      process.exit(1);
    }
  }

  const config = {
    ...customConfig,
    inputDir: argv.input,
    outputDir: argv.output
  };

  const processor = new WebflowProcessor(config);
  
  try {
    const result = await processor.processFiles();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { WebflowProcessor, HtmlProcessor };