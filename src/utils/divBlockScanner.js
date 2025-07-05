import * as cheerio from 'cheerio';
import { findFiles, readFile, writeFile, ensureDirectoryExists } from './fileUtils.js';
import path from 'path';
import fs from 'fs/promises';

export class DivBlockScanner {
  constructor() {
    this.report = [];
    this.reportContent = '';
  }

  async scanDirectory(directory) {
    console.log('🔍 Scanning for div-block* classes...\n');
    
    const htmlFiles = await findFiles('**/*.html', directory);
    
    for (const file of htmlFiles) {
      await this.scanFile(file, directory);
    }
    
    await this.generateReport();
  }

  async scanFile(filePath, baseDir) {
    const content = await readFile(filePath);
    const $ = cheerio.load(content);
    const relativePath = path.relative(baseDir, filePath);
    
    const divBlockElements = [];
    
    // Find all elements with classes that contain 'div-block'
    $('[class*="div-block"]').each((i, elem) => {
      const $elem = $(elem);
      const classes = $elem.attr('class') || '';
      
      // Extract div-block classes
      const divBlockClasses = classes
        .split(/\s+/)
        .filter(cls => cls.includes('div-block'));
      
      if (divBlockClasses.length > 0) {
        const tagName = elem.name;
        const id = $elem.attr('id') || '';
        const parent = $elem.parent().prop('tagName') || 'none';
        
        // Get a snippet of the element's content
        const text = $elem.text().trim().substring(0, 50);
        const contentSnippet = text ? `"${text}${text.length >= 50 ? '...' : ''}"` : '';
        
        divBlockElements.push({
          classes: divBlockClasses,
          tagName,
          id,
          parent,
          contentSnippet,
          line: this.getLineNumber($, elem)
        });
      }
    });
    
    if (divBlockElements.length > 0) {
      this.report.push({
        file: relativePath,
        count: divBlockElements.length,
        elements: divBlockElements
      });
    }
  }

  getLineNumber($, elem) {
    // This is a simplified line number approximation
    // In a real scenario, you might want to use the original HTML position
    const html = $.html();
    const elemHtml = $(elem).prop('outerHTML');
    const position = html.indexOf(elemHtml);
    const lines = html.substring(0, position).split('\n');
    return lines.length;
  }

  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `div-block-report-${timestamp}.txt`;
    
    // Helper function to add content to both console and report
    const log = (content = '') => {
      console.log(content);
      this.reportContent += content + '\n';
    };
    
    log('📊 DIV-BLOCK CLASS REPORT');
    log('========================\n');
    log(`Generated: ${new Date().toLocaleString()}\n`);
    
    if (this.report.length === 0) {
      log('✅ No div-block* classes found in any HTML files.\n');
      await this.saveReport(reportFileName);
      return;
    }
    
    let totalElements = 0;
    
    // Summary
    log(`📄 Files with div-block classes: ${this.report.length}`);
    
    this.report.forEach(fileReport => {
      totalElements += fileReport.count;
    });
    
    log(`🔢 Total div-block elements found: ${totalElements}\n`);
    
    // Detailed report
    log('DETAILED FINDINGS:');
    log('------------------\n');
    
    this.report.forEach(fileReport => {
      log(`📄 ${fileReport.file}`);
      log(`   Found ${fileReport.count} element(s) with div-block classes:\n`);
      
      fileReport.elements.forEach((elem, index) => {
        log(`   ${index + 1}. <${elem.tagName}> at line ~${elem.line}`);
        log(`      Classes: ${elem.classes.join(', ')}`);
        if (elem.id) {
          log(`      ID: ${elem.id}`);
        }
        log(`      Parent: <${elem.parent}>`);
        if (elem.contentSnippet) {
          log(`      Content: ${elem.contentSnippet}`);
        }
        log('');
      });
      
      log('');
    });
    
    // Summary by class name
    log('SUMMARY BY CLASS NAME:');
    log('----------------------');
    
    const classCounts = {};
    this.report.forEach(fileReport => {
      fileReport.elements.forEach(elem => {
        elem.classes.forEach(cls => {
          classCounts[cls] = (classCounts[cls] || 0) + 1;
        });
      });
    });
    
    Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([className, count]) => {
        log(`   ${className}: ${count} occurrence(s)`);
      });
    
    log('\n✨ Report complete!\n');
    
    await this.saveReport(reportFileName);
  }

  async saveReport(fileName) {
    const reportsDir = path.join(process.cwd(), 'reports');
    await ensureDirectoryExists(reportsDir);
    
    const filePath = path.join(reportsDir, fileName);
    await writeFile(filePath, this.reportContent);
    
    console.log(`\n📁 Report saved to: ${path.relative(process.cwd(), filePath)}`);
  }
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new DivBlockScanner();
  const directory = process.argv[2] || 'dist';
  scanner.scanDirectory(directory).catch(console.error);
}