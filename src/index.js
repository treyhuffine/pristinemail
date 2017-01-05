import { validateFile, validateUrl } from './validate-email';
import { markdownToHtml, baseHtml } from './markdown-html';

const pristinemail = {
  baseHtml,
  markdownToHtml,
  validateFile,
  validateUrl
};

export default pristinemail;
