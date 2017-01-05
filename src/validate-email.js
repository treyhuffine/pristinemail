import fs from 'fs';
import fetch from 'node-fetch';
import { processWarnings } from './validation-output';
import { parseHtml } from './html-parser'

export function validateFile(fileName, writePath ,options = {}) {
  const html = fs.readFileSync(fileName),
    warnings = parseHtml(html, fileName);

  processWarnings(warnings, fileName, writePath, options);
}

export function validateUrl(url, writePath, options = {}) {
  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      const warnings = parseHtml(html, url);

      processWarnings(warnings, url, writePath, options);
    })
    .catch((err) => {
      console.log(err);
    });
}
