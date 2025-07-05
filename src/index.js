import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as defaultConfig } from './config.js';
import { HtmlProcessor } from './processors/htmlProcessor.js';
import { findFiles, readFile, writeFile, getOutputPath } from './utils/fileUtils.js';

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