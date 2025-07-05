import * as cheerio from 'cheerio';
import beautify from 'js-beautify';

export class HtmlProcessor {
  constructor(config) {
    this.config = config;
    this.processors = [];
    this.initializeProcessors();
  }

  initializeProcessors() {
    if (this.config.processors.removeWebflowAttributes?.enabled) {
      this.processors.push(this.removeWebflowAttributes.bind(this));
    }
    if (this.config.processors.removeGoogleFontsAndWebflowJS?.enabled) {
      this.processors.push(this.removeGoogleFontsAndWebflowJS.bind(this));
    }
    if (this.config.processors.injectCustomCSS?.enabled) {
      this.processors.push(this.injectCustomCSS.bind(this));
    }
  }

  async process(html) {
    let $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: false
    });

    for (const processor of this.processors) {
      $ = await processor($);
    }

    const processedHtml = $.html();
    
    // Beautify the HTML if enabled
    if (this.config.beautify?.enabled !== false) {
      return beautify.html(processedHtml, {
        indent_size: 2,
        indent_char: ' ',
        preserve_newlines: true,
        max_preserve_newlines: 2,
        wrap_line_length: 0,
        wrap_attributes: 'auto',
        wrap_attributes_indent_size: 2,
        end_with_newline: true,
        unformatted: ['script', 'style'],
        content_unformatted: [],
        extra_liners: []
      });
    }

    return processedHtml;
  }

  removeWebflowAttributes($) {
    const attributes = this.config.processors.removeWebflowAttributes.attributes;
    
    attributes.forEach(attr => {
      $(`[${attr}]`).removeAttr(attr);
    });

    return $;
  }

  removeGoogleFontsAndWebflowJS($) {
    // Remove Google Fonts preconnect links
    $('link[href="https://fonts.googleapis.com"][rel="preconnect"]').remove();
    $('link[href="https://fonts.gstatic.com"][rel="preconnect"]').remove();
    
    // Remove WebFont loader script
    $('script[src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"]').remove();
    
    // Remove inline scripts containing WebFont.load
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('WebFont.load')) {
        $(elem).remove();
      }
    });
    
    // Remove Webflow w-mod script
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('w-mod-') && scriptContent.includes('ontouchstart')) {
        $(elem).remove();
      }
    });
    
    // Remove jQuery script from Cloudfront
    $('script[src*="d3e54v103j8qbb.cloudfront.net"][src*="jquery"]').remove();
    
    // Remove next-staging-core.js script (handles relative paths)
    $('script[src$="next-staging-core.js"]').remove();

    return $;
  }

  injectCustomCSS($) {
    // Find the next-staging-core.css link (handles both relative and absolute paths)
    const nextStagingCoreLinks = $('link[href$="next-staging-core.css"]');
    
    nextStagingCoreLinks.each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      
      // Extract the path prefix (e.g., '../css/', 'css/', '../../css/')
      const pathPrefix = href.substring(0, href.lastIndexOf('next-staging-core.css'));
      
      // Create the custom.css link with the same path prefix
      const customCSSLink = `<link href="${pathPrefix}custom.css" rel="stylesheet" type="text/css">`;
      
      // Insert it after next-staging-core.css
      $link.after('\n  ' + customCSSLink);
    });

    return $;
  }

  addProcessor(name, processorFn) {
    this.processors.push(processorFn.bind(this));
  }
}

export default HtmlProcessor;