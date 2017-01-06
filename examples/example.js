import path from 'path';
import pristinemail from '../src/index';

const exampleEmailPath = path.join(__dirname, './example.html'),
  markdownValidationPath = path.join(__dirname, './vadliation.md'),
  htmlValidationPath = path.join(__dirname, './validation.html');

pristinemail.validateFile(
  exampleEmailPath,
  markdownValidationPath,
  { output: ['print', 'markdown'] }
);

const html = pristinemail.markdownToHtml(
  markdownValidationPath,
  {
    buildHtmlDoc: true,
    writePath: htmlValidationPath
  }
);
