"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
const textOffset = 30;
function splitPdf() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!pdfFile) {
            return;
        }
        // Load your PDFDocument
        const pdfLibDoc = yield window.PDFLib.PDFDocument.load(pdfFile);
        const subDocument = yield window.PDFLib.PDFDocument.create();
        const idxsRaw = document.querySelector("#pages").value.split(/[\s,]/);
        const idxs = [];
        idxsRaw.forEach((x) => {
            const matches = x.match(/^(\d+)(\-(\d+))?$/);
            if (!matches) {
                return;
            }
            const leftMatch = parseInt(matches[1]) - 1;
            if (leftMatch < 0 || leftMatch >= pdfDoc.numPages) {
                return;
            }
            if (matches[3]) {
                const rightMatch = parseInt(matches[3]) - 1;
                if (rightMatch < 0 ||
                    rightMatch <= leftMatch ||
                    rightMatch >= pdfDoc.numPages) {
                    return;
                }
                idxs.push(...arrayRange(leftMatch, rightMatch, 1));
            }
            else {
                idxs.push(leftMatch);
            }
        });
        if (idxs.length == 0) {
            return;
        }
        console.log(idxs);
        let templateText = getTemplateText();
        const copiedPages = yield subDocument.copyPages(pdfLibDoc, idxs);
        let i = 0;
        for (const copiedPage of copiedPages) {
            handleTextDrawingAndRotation(templateText, i, idxs[i] + 1, copiedPage);
            subDocument.addPage(copiedPage);
            i++;
        }
        const pdfBytes = yield subDocument.save();
        yield downloadFileThroughATagWithBlob(pdfBytes, `file.pdf`);
    });
}
function getTemplateText() {
    var _a;
    let templateText = (_a = document.getElementById("template_text")) === null || _a === void 0 ? void 0 : _a.value;
    if (templateText) {
        templateText = templateText
            .replace(/%file_name%/g, fileName)
            .replace(/%number_pages%/g, pdfDoc.numPages);
    }
    return templateText;
}
function handleTextDrawingAndRotation(templateText, index, pageNumber, page) {
    const { width, height } = page.getSize();
    let x = 0, y = height - textOffset;
    if (rotation[index + 1]) {
        page.setRotation(window.PDFLib.degrees(rotation[index + 1]));
        switch (rotation[index + 1]) {
            case 90:
            case -270:
                x = textOffset;
                y = 0;
                break;
            case 180:
            case -180:
                x = width;
                y = textOffset;
                break;
            case 270:
            case -90:
                x = width - textOffset;
                y = height;
                break;
        }
    }
    let insertedText = "";
    if (templateText) {
        insertedText = templateText.replace(/%page_number%/g, pageNumber.toString());
        console.log(insertedText);
        page.drawText(encodeText2(insertedText), {
            x,
            y,
            rotate: window.PDFLib.degrees(rotation[index + 1] || 0),
        });
    }
}
function downloadFileThroughATagWithBlob(blob, fileName) {
    const url = window.URL.createObjectURL(new Blob([blob]));
    downloadFileThroughATagWithUrl(url, fileName);
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}
function downloadFileThroughATagWithUrl(objectUrl, fileName) {
    const a = document.createElement("a");
    a.style.cssText = "display: none";
    document.body.appendChild(a);
    a.href = objectUrl;
    a.download = fileName;
    a.click();
    document.body.removeChild(a);
}
document.getElementById("button").addEventListener("click", splitPdf);
function saveOriginal() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!pdfFile) {
            return;
        }
        const pdfLibDoc = yield window.PDFLib.PDFDocument.load(pdfFile);
        const pages = pdfLibDoc.getPages();
        const templateText = getTemplateText();
        for (let i = 0; i < pages.length; i++) {
            handleTextDrawingAndRotation(templateText, i, i + 1, pages[i]);
        }
        const pdfBytes = yield pdfLibDoc.save();
        yield downloadFileThroughATagWithBlob(pdfBytes, `file.pdf`);
    });
}
document.getElementById("saveButton").addEventListener("click", saveOriginal);
var pdfDoc = null, pdfFile = undefined, fileName = "", pageNum = 1, pageRendering = false, pageNumPending = null, scale = 0.8, canvas = document.getElementById("the-canvas"), ctx = canvas.getContext("2d"), rotation;
/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        var viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.transform = `rotate(${rotation[num] || 0}deg)`;
        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };
        var renderTask = page.render(renderContext);
        // Wait for rendering to finish
        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
    // Update page counters
    document.getElementById("page_num").textContent =
        num.toString();
}
/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    }
    else {
        renderPage(num);
    }
}
/**
 * Displays previous page.
 */
function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}
document.getElementById("prev").addEventListener("click", onPrevPage);
/**
 * Displays next page.
 */
function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
document.getElementById("next").addEventListener("click", onNextPage);
function rotateLeft() {
    if (!pdfFile) {
        return;
    }
    rotation[pageNum] = ((rotation[pageNum] || 0) - 90) % 360;
    canvas.style.transform = `rotate(${rotation[pageNum] || 0}deg)`;
}
document.getElementById("leftRotate").addEventListener("click", rotateLeft);
function rotateRight() {
    if (!pdfFile) {
        return;
    }
    rotation[pageNum] = ((rotation[pageNum] || 0) + 90) % 360;
    canvas.style.transform = `rotate(${rotation[pageNum] || 0}deg)`;
}
document.getElementById("rightRotate").addEventListener("click", rotateRight);
(_a = document.getElementById("pdfinput")) === null || _a === void 0 ? void 0 : _a.addEventListener("change", loadFile);
function loadFile() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const el = document.querySelector("#pdfinput");
        if (!((_a = el.files) === null || _a === void 0 ? void 0 : _a.length)) {
            return;
        }
        pdfFile = yield el.files[0].arrayBuffer();
        fileName = el.files[0].name;
        rotation = {};
        /**
         * Asynchronously downloads PDF.
         */
        pdfjsLib.getDocument(pdfFile.slice()).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            document.getElementById("page_count").textContent = pdfDoc.numPages;
            // Initial/first page rendering
            renderPage((pageNum = 1));
        });
    });
}
const arrayRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (value, index) => start + index * step);
const encodeText2 = (text) => {
    return Array.from(text)
        .map((x) => (x.charCodeAt(0) > 255 ? "_" : x))
        .join("");
};
