import fs from 'fs';
import fetch from 'node-fetch';
import { processEmailAnalysis } from './validation-output';
import { parseHtml } from './html-parser'

export function validateFile(fileName, writePath ,options = {}) {
  const html = fs.readFileSync(fileName),
    emailAnalysis = parseHtml(html, fileName);

  processEmailAnalysis(emailAnalysis, fileName, writePath, options);
}

export function validateUrl(url, writePath, options = {}) {
  fetch(url)
    .then((res) => res.text())
    .then((html) => {
      const emailAnalysis = parseHtml(html, url);

      processEmailAnalysis(emailAnalysis, url, writePath, options);
    })
    .catch((err) => {
      console.log(err);
    });
}
