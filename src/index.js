import { validateFile, validateUrl } from './validate-email';
import { markdownToHtml, baseHtml } from './markdown-html';
import { parseHtml, validateNodeStyle } from './html-parser';

const pristinemail = {
  baseHtml,
  markdownToHtml,
  parseHtml,
  validateFile,
  validateNodeStyle,
  validateUrl
};

export default pristinemail;
