// @ts-check

const PDFDocument = PDFLib.PDFDocument;

async function splitPdf() {
  const docmentAsBytes = await document
    .querySelector("#pdfinput")
    .files[0].arrayBuffer();

  // Load your PDFDocument
  const pdfDoc = await PDFDocument.load(docmentAsBytes);

  const subDocument = await PDFDocument.create();

  const idxs = document
    .querySelector("#pages")
    .value.split(/[\s,]/)
    .map((x) => parseInt(x) - 1);
  console.log(idxs);

  const copiedPages = await subDocument.copyPages(pdfDoc, idxs);

  for (const copiedPage of copiedPages) {
    subDocument.addPage(copiedPage);
  }
  const pdfBytes = await subDocument.save();
  await downloadFileThroughATagWithBlob(pdfBytes, `file.pdf`);
}




/**
 *
 * @param {Uint8Array} blob
 * @param {string} fileName
 */
function downloadFileThroughATagWithBlob(blob, fileName) {
  const url = window.URL.createObjectURL(new Blob([blob]));

  downloadFileThroughATagWithUrl(url, fileName);
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}

/**
 *
 * @param {string} objectUrl
 * @param {string} fileName
 */
function downloadFileThroughATagWithUrl(objectUrl, fileName) {
  const a = document.createElement("a");
  a.style = "display: none";
  document.body.appendChild(a);

  a.href = objectUrl;
  a.download = fileName;
  a.click();

  document.body.removeChild(a);
}

document.querySelector("#button").addEventListener("click", splitPdf);
