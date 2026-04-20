const PDF_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #111827;
    padding: 48px 56px;
    max-width: 800px;
    margin: 0 auto;
  }
  h1.article-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2rem;
    line-height: 1.25;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }
  h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
  h2 { font-size: 1.375rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
  h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.4rem; }
  p { margin: 0.625em 0; }
  ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  li { margin: 0.25rem 0; }
  blockquote {
    border-left: 3px solid #f59e0b;
    padding-left: 1rem;
    color: #6b7280;
    margin: 1rem 0;
    font-style: italic;
  }
  code {
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.8125rem;
    background: #f3f4f6;
    border-radius: 3px;
    padding: 0.1em 0.3em;
  }
  pre {
    background: #1f2937;
    color: #f9fafb;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  pre code { background: transparent; color: inherit; padding: 0; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
  mark { background: #fef3c7; color: #92400e; padding: 0.05em 0.2em; border-radius: 2px; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9375rem; }
  th, td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  ul[data-type='taskList'] { list-style: none; padding-left: 0.25rem; }
  ul[data-type='taskList'] li { display: flex; align-items: flex-start; gap: 0.5rem; }
  ul[data-type='taskList'] li label { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.125rem; }
  ul[data-type='taskList'] li input[type='checkbox'] { width: 1rem; height: 1rem; }
  ul[data-type='taskList'] li[data-checked='true'] > div { text-decoration: line-through; color: #9ca3af; }
  @media print {
    body { padding: 0; }
    @page { margin: 2cm; }
  }
`

export function printArticle(title: string, html: string): void {
  const iframe = document.createElement("iframe")
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8" />
    <title>${title.replace(/</g, "&lt;")}</title>
    <style>${PDF_STYLES}</style>
  </head><body>
    <h1 class="article-title">${title.replace(/</g, "&lt;")}</h1>
    ${html}
  </body></html>`)
  doc.close()

  iframe.contentWindow!.focus()
  iframe.contentWindow!.print()
  setTimeout(() => document.body.removeChild(iframe), 1000)
}
