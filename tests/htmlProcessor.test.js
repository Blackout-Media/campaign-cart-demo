import { HtmlProcessor } from '../src/processors/htmlProcessor.js';

describe('HtmlProcessor', () => {
  let processor;
  let config;

  beforeEach(() => {
    config = {
      processors: {
        removeWebflowAttributes: {
          enabled: true,
          attributes: ['data-wf-page', 'data-wf-site']
        }
      }
    };
    processor = new HtmlProcessor(config);
  });

  describe('removeWebflowAttributes', () => {
    it('should remove data-wf-page and data-wf-site attributes from html tag', async () => {
      const input = `<!DOCTYPE html>
<html data-wf-page="685996de362613655dd702b6" data-wf-site="685996de362613655dd702b4" lang="en">
<head>
  <title>Test</title>
</head>
<body>
  <div data-wf-page="test">Content</div>
</body>
</html>`;

      const expected = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  <div>Content</div>
</body>
</html>`;

      const result = await processor.process(input);
      expect(result).toBe(expected);
    });

    it('should handle multiple elements with webflow attributes', async () => {
      const input = `<div data-wf-page="123" data-wf-site="456">
  <span data-wf-page="789">Text</span>
  <p data-wf-site="abc">Paragraph</p>
</div>`;

      const result = await processor.process(input);
      expect(result).not.toContain('data-wf-page');
      expect(result).not.toContain('data-wf-site');
      expect(result).toContain('<span>Text</span>');
      expect(result).toContain('<p>Paragraph</p>');
    });

    it('should preserve other attributes', async () => {
      const input = `<div id="test" class="container" data-wf-page="123" data-custom="value">Content</div>`;
      const result = await processor.process(input);
      
      expect(result).toContain('id="test"');
      expect(result).toContain('class="container"');
      expect(result).toContain('data-custom="value"');
      expect(result).not.toContain('data-wf-page');
    });

    it('should handle empty HTML', async () => {
      const input = '';
      const result = await processor.process(input);
      expect(result).toBe('');
    });

    it('should handle HTML without webflow attributes', async () => {
      const input = `<html><body><h1>Hello World</h1></body></html>`;
      const result = await processor.process(input);
      expect(result).toBe(input);
    });
  });

  describe('removeGoogleFontsAndWebflowJS', () => {
    beforeEach(() => {
      config.processors.removeGoogleFontsAndWebflowJS = { enabled: true };
      processor = new HtmlProcessor(config);
    });

    it('should remove Google Fonts preconnect links', async () => {
      const input = `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous">
  <link href="styles.css" rel="stylesheet">
</head>
<body></body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('https://fonts.googleapis.com');
      expect(result).not.toContain('https://fonts.gstatic.com');
      expect(result).toContain('styles.css'); // Other links preserved
    });

    it('should remove WebFont loader script', async () => {
      const input = `<html>
<head>
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
  <script src="app.js"></script>
</head>
<body></body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('webfont.js');
      expect(result).toContain('app.js'); // Other scripts preserved
    });

    it('should remove inline WebFont.load script', async () => {
      const input = `<html>
<head>
  <script type="text/javascript">
    WebFont.load({
      google: {
        families: ["Lato:100,100italic,300,300italic,400,400italic,700,700italic,900,900italic"]
      }
    });
  </script>
  <script>console.log("other script");</script>
</head>
<body></body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('WebFont.load');
      expect(result).toContain('console.log("other script")'); // Other scripts preserved
    });

    it('should remove Webflow w-mod script', async () => {
      const input = `<html>
<head>
  <script type="text/javascript">
    ! function(o, c) {
      var n = c.documentElement,
        t = " w-mod-";
      n.className += t + "js", ("ontouchstart" in o || o.DocumentTouch && c instanceof DocumentTouch) && (n.className += t + "touch")
    }(window, document);
  </script>
</head>
<body></body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('w-mod-');
      expect(result).not.toContain('ontouchstart');
    });

    it('should remove jQuery script from Cloudfront', async () => {
      const input = `<html>
<body>
  <h1>Content</h1>
  <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=685996de362613655dd702b4" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
  <script src="app.js"></script>
</body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('d3e54v103j8qbb.cloudfront.net');
      expect(result).not.toContain('jquery');
      expect(result).toContain('app.js'); // Other scripts preserved
    });

    it('should remove next-staging-core.js script', async () => {
      const input = `<html>
<body>
  <h1>Content</h1>
  <script src="js/next-staging-core.js" type="text/javascript"></script>
  <script src="js/app.js"></script>
</body>
</html>`;

      const result = await processor.process(input);
      expect(result).not.toContain('next-staging-core.js');
      expect(result).toContain('js/app.js'); // Other scripts preserved
    });

    it('should remove all targeted elements in one pass', async () => {
      const input = `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <link href="https://fonts.gstatic.com" rel="preconnect" crossorigin="anonymous">
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
  <script type="text/javascript">
    WebFont.load({
      google: {
        families: ["Lato:100,100italic,300,300italic,400,400italic,700,700italic,900,900italic"]
      }
    });
  </script>
  <script type="text/javascript">
    ! function(o, c) {
      var n = c.documentElement,
        t = " w-mod-";
      n.className += t + "js", ("ontouchstart" in o || o.DocumentTouch && c instanceof DocumentTouch) && (n.className += t + "touch")
    }(window, document);
  </script>
  <title>Test Page</title>
</head>
<body>
  <h1>Content</h1>
  <script src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=685996de362613655dd702b4" type="text/javascript" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
  <script src="js/next-staging-core.js" type="text/javascript"></script>
</body>
</html>`;

      const result = await processor.process(input);
      
      // All targeted elements should be removed
      expect(result).not.toContain('fonts.googleapis.com');
      expect(result).not.toContain('fonts.gstatic.com');
      expect(result).not.toContain('webfont.js');
      expect(result).not.toContain('WebFont.load');
      expect(result).not.toContain('w-mod-');
      expect(result).not.toContain('d3e54v103j8qbb.cloudfront.net');
      expect(result).not.toContain('jquery');
      expect(result).not.toContain('next-staging-core.js');
      
      // Other content should be preserved
      expect(result).toContain('<title>Test Page</title>');
      expect(result).toContain('<h1>Content</h1>');
    });
  });

  describe('processor configuration', () => {
    it('should not process when removeWebflowAttributes is disabled', async () => {
      config.processors.removeWebflowAttributes.enabled = false;
      processor = new HtmlProcessor(config);
      
      const input = `<html data-wf-page="123" data-wf-site="456"><body></body></html>`;
      const result = await processor.process(input);
      
      expect(result).toContain('data-wf-page="123"');
      expect(result).toContain('data-wf-site="456"');
    });

    it('should not process when removeGoogleFontsAndWebflowJS is disabled', async () => {
      config.processors.removeGoogleFontsAndWebflowJS.enabled = false;
      processor = new HtmlProcessor(config);
      
      const input = `<html>
<head>
  <link href="https://fonts.googleapis.com" rel="preconnect">
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"></script>
</head>
<body></body>
</html>`;
      const result = await processor.process(input);
      
      expect(result).toContain('fonts.googleapis.com');
      expect(result).toContain('webfont.js');
    });

    it('should allow adding custom processors', async () => {
      let customProcessorCalled = false;
      
      processor.addProcessor('custom', function($) {
        customProcessorCalled = true;
        $('body').addClass('processed');
        return $;
      });

      const input = `<html><body></body></html>`;
      const result = await processor.process(input);
      
      expect(customProcessorCalled).toBe(true);
      expect(result).toContain('class="processed"');
    });
  });
});