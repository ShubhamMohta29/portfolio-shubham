// Opens and closes the planet detail sheet and PDF viewer.

import { renderSheetHTML } from '../adapters/SheetRenderer.js';

export class PlanetInteractionUseCase {
  #planetSheet; #sheetContent; #pdfModal; #pdfFrame;

  constructor({ planetSheet, sheetContent, pdfModal, pdfFrame }) {
    this.#planetSheet  = planetSheet;
    this.#sheetContent = sheetContent;
    this.#pdfModal     = pdfModal;
    this.#pdfFrame     = pdfFrame;
  }

  openPlanetSheet(pd) {
    if (pd.content.type === 'pdf') { this.openPDF(pd.content.url); return; }
    this.#sheetContent.innerHTML = renderSheetHTML(pd.content);
    this.#planetSheet.classList.add('active');
    document.body.classList.add('sheet-open');
  }

  closePlanetSheet() {
    this.#planetSheet.classList.remove('active');
    document.body.classList.remove('sheet-open');
  }

  openPDF(url) {
    this.#pdfFrame.src = url;
    this.#pdfModal.classList.add('active');
  }

  closePDF() {
    this.#pdfModal.classList.remove('active');
    this.#pdfFrame.src = '';
  }
}
