# Webflow HTML Processor

A Node.js tool to clean up HTML exports from Webflow and perform various code transformations.

## Features

- ✅ Remove Webflow-specific attributes (`data-wf-page`, `data-wf-site`)
- 📁 Process entire directory structures while maintaining hierarchy
- 🔧 Modular architecture for easy extension
- 🧪 Comprehensive test coverage
- ⚡ Fast and efficient processing

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Process all HTML files from the `import` directory to the `dist` directory:

```bash
npm start
```

### Command Line Options

```bash
node src/index.js --input <inputDir> --output <outputDir>
```

Options:
- `-i, --input`: Input directory containing HTML files (default: `import`)
- `-o, --output`: Output directory for processed files (default: `dist`)
- `-c, --config`: Path to custom configuration file

### Examples

```bash
# Process with custom directories
node src/index.js -i import -o dist

# Use custom configuration
node src/index.js --config ./custom-config.js
```

## Configuration

The default configuration is in `src/config.js`. You can create a custom configuration file:

```javascript
export default {
  inputDir: 'import',
  outputDir: 'dist',
  processors: {
    removeWebflowAttributes: {
      enabled: true,
      attributes: ['data-wf-page', 'data-wf-site']
    }
  },
  filePatterns: {
    html: '**/*.html'
  }
};
```

## Extending the Processor

You can add custom processors to extend functionality:

```javascript
import { WebflowProcessor, HtmlProcessor } from './src/index.js';

const processor = new WebflowProcessor(config);

// Add custom processor
processor.htmlProcessor.addProcessor('customProcessor', function($) {
  // Your custom processing logic
  $('script').remove(); // Example: remove all script tags
  return $;
});

await processor.processFiles();
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
.
├── src/
│   ├── index.js              # Main entry point
│   ├── config.js             # Default configuration
│   ├── processors/
│   │   └── htmlProcessor.js  # HTML processing logic
│   └── utils/
│       └── fileUtils.js      # File system utilities
├── tests/
│   ├── htmlProcessor.test.js # Unit tests for HTML processor
│   ├── fileUtils.test.js     # Unit tests for utilities
│   └── integration.test.js   # Integration tests
├── import/                   # Input directory (HTML files from Webflow)
├── dist/                     # Output directory (processed files)
└── package.json
```

## License

ISC