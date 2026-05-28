// Pure function: converts planet content data into an HTML string for the detail sheet.

export function renderSheetHTML(content) {
  if (content.type === 'project') {
    return `<p class="sheet-meta">${content.meta}</p>
            <h2 class="sheet-title">${content.heading}</h2>
            <p class="sheet-body">${content.body}</p>
            <a class="sheet-link" href="${content.url}" target="_blank">View on GitHub →</a>`;
  }
  if (content.type === 'link') {
    const target = content.url.startsWith('mailto') ? '_self' : '_blank';
    return `<h2 class="sheet-title">${content.heading}</h2>
            <p class="sheet-value">${content.value}</p>
            <a class="sheet-link" href="${content.url}" target="${target}">${content.btnLabel}</a>`;
  }
  if (content.type === 'info') {
    return `<h2 class="sheet-title">${content.heading}</h2>
            <p class="sheet-body">${content.body}</p>`;
  }
  if (content.type === 'skills') {
    return `<h2 class="sheet-title">${content.heading}</h2>
            <div class="sheet-skills">${content.skills.map(s => `<span>${s}</span>`).join('')}</div>`;
  }
  return '';
}
