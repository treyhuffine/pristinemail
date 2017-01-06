import fs from 'fs';
import path from 'path';
import marked from 'marked';
import chalk from 'chalk';

const markdownStyles = `body {
    padding: 0 40px;
  }
  #unsupported-styles- {
    color: red;
  }
  #potential-conflict-warning- {
    color: orange;
  }
  #unrecognized-styles- {
    color: magenta;
  }
  code {
    backround-color: #F7F7F7;
    padding: 2px;
  }
  h2 {
    margin-left: -30px;
  }`;

export function baseHtml(markdown, style = markdownStyles) {
  const html =
    `<!DOCTYPE html>
    <html>
      <head>
        <style>
          ${style}
        </style>
      </head>
      <body>
        ${markdown}
      </body>
    </html>`;

    return html;
}

export function markdownToHtml(fileName, options = {}) {
  fs.readFile(fileName, 'utf-8', (err, data) => {
    const html = baseHtml(marked(data));
    if (options.writeFile && options.writePath) {
      fs.writeFile(options.writePath, html);

      console.log(chalk.blue(`* HTML saved to ${options.writePath}\n`));
    }

    return html;
  });
}
