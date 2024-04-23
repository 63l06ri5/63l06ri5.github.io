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
var _a, _b, _c;
const textOffset = 30;
// type PDFPage = typeof window.PDFLib.PDFPage;
function splitPdf() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)) {
            return;
        }
        const idxsRaw = document.querySelector("#pages").value.split(/[\s,]/);
        const idxs = [];
        idxsRaw.forEach((x) => {
            const matches = x.match(/^(\d+)(\-(\d+))?$/);
            if (!matches) {
                return;
            }
            const leftMatch = parseInt(matches[1]) - 1;
            if (leftMatch < 0 || leftMatch >= numPages) {
                return;
            }
            if (matches[3]) {
                const rightMatch = parseInt(matches[3]) - 1;
                if (rightMatch < 0 || rightMatch <= leftMatch || rightMatch >= numPages) {
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
        const subDocument = yield window.PDFLib.PDFDocument.create();
        const indexes = Array.from(Array(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)).map((_) => []);
        const indexesWithoutOffset = Array.from(Array(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)).map((_) => []);
        idxs.forEach((idx) => indexes[pageFileMapping[idx]].push(idx));
        indexesWithoutOffset[0] = indexes[0];
        for (let i = 1; i < indexes.length; i++) {
            const offest = pagesNumbers.slice(0, i).reduce((s, v) => s + v, 0);
            indexesWithoutOffset[i] = indexes[i].map((x) => x - offest);
        }
        const templateTexts = idxs.map((idx) => getTemplateText(fileNames[pageFileMapping[idx]]));
        let copiedPages = [];
        for (let j = 0; j < (pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length); j++) {
            const pdfLibDoc = yield window.PDFLib.PDFDocument.load(pdfFiles[j]);
            copiedPages = [
                ...copiedPages,
                ...(yield subDocument.copyPages(pdfLibDoc, indexesWithoutOffset[j])),
            ];
        }
        const idxsToCopiedPages = indexes.flat();
        for (let i = 0; i < idxs.length; i++) {
            const ind = idxsToCopiedPages.indexOf(idxs[i]);
            const copiedPage = copiedPages[ind];
            handleTextDrawingAndRotation(templateTexts[i], idxs[i], idxs[i] + 1, copiedPage);
            subDocument.addPage(copiedPage);
        }
        const pdfBytes = yield subDocument.save();
        yield downloadFileThroughATagWithBlob(pdfBytes, `file.pdf`);
    });
}
function getTemplateText(fileName) {
    var _a;
    let templateText = (_a = document.getElementById("template_text")) === null || _a === void 0 ? void 0 : _a.value;
    if (templateText) {
        templateText = templateText
            .replace(/%file_name%/g, fileName)
            .replace(/%number_pages%/g, numPages.toString());
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
        if (!(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)) {
            return;
        }
        let pdfLibDoc;
        let pdfLibDocs = [];
        for (let i = 0; i < (pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length); i++) {
            pdfLibDocs.push(yield window.PDFLib.PDFDocument.load(pdfFiles[i]));
        }
        if (pdfFiles.length == 1) {
            pdfLibDoc = pdfLibDocs[0];
        }
        else {
            pdfLibDoc = yield window.PDFLib.PDFDocument.create();
            for (let i = 0; i < pdfLibDocs.length; i++) {
                const copiedPagesA = yield pdfLibDoc.copyPages(pdfLibDocs[i], pdfLibDocs[i].getPageIndices());
                copiedPagesA.forEach((page) => pdfLibDoc.addPage(page));
            }
        }
        const pages = pdfLibDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
            const templateText = getTemplateText(fileNames[pageFileMapping[i]]);
            handleTextDrawingAndRotation(templateText, i, i + 1, pages[i]);
        }
        const pdfBytes = yield pdfLibDoc.save();
        yield downloadFileThroughATagWithBlob(pdfBytes, `file.pdf`);
    });
}
document.getElementById("saveButton").addEventListener("click", saveOriginal);
var pdfDocs = [], pdfFiles = undefined, fileNames = [], pageNum = 1, numPages = 0, pagesNumbers = [], pageFileMapping = [], pageRendering = false, pageNumPending = null, scale = 0.8, canvas = document.getElementById("the-canvas"), ctx = canvas.getContext("2d"), rotation;
/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    let pdfNum = num;
    for (let i = 0; i < pageFileMapping[num - 1]; i++) {
        pdfNum -= pagesNumbers[i];
    }
    pdfDocs[pageFileMapping[num - 1]].getPage(pdfNum).then(function (page) {
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
    document.getElementById("page_num").value =
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
    if (pageNum >= numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
document.getElementById("next").addEventListener("click", onNextPage);
function rotateLeft() {
    if (!(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)) {
        return;
    }
    rotation[pageNum] = ((rotation[pageNum] || 0) - 90) % 360;
    canvas.style.transform = `rotate(${rotation[pageNum] || 0}deg)`;
}
document.getElementById("leftRotate").addEventListener("click", rotateLeft);
function rotateRight() {
    if (!(pdfFiles === null || pdfFiles === void 0 ? void 0 : pdfFiles.length)) {
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
        pdfFiles = [];
        fileNames = [];
        for (let i = 0; i < el.files.length; i++) {
            pdfFiles.push(yield el.files[i].arrayBuffer());
            fileNames.push(el.files[i].name);
        }
        rotation = {};
        /**
         * Asynchronously downloads PDF.
         */
        pdfDocs = yield Promise.all(pdfFiles.map((pdfFile) => pdfjsLib.getDocument(pdfFile.slice(0)).promise));
        pageFileMapping = pdfDocs
            .map((pdfDoc, i) => Array.from(Array(pdfDoc.numPages)).map((_) => i))
            .flat();
        pagesNumbers = pdfDocs.map((pdfDoc) => pdfDoc.numPages);
        document.getElementById("page_count").textContent = numPages =
            pagesNumbers.reduce((sum, v) => sum + v, 0);
        // pdfjsLib.getDocument(pdfFile.slice()).promise.then(function (pdfDoc_) {
        //   pdfDoc = pdfDoc_;
        //   document.getElementById("page_count")!.textContent = pdfDoc.numPages;
        //   // Initial/first page rendering
        //   renderPage((pageNum = 1));
        // });
        renderPage((pageNum = 1));
    });
}
const arrayRange = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (value, index) => start + index * step);
const encodeText2 = (text) => {
    return Array.from(text)
        .map((x) => (x.charCodeAt(0) > 255 ? "_" : x))
        .join("");
};
(_b = document.getElementById("page_num")) === null || _b === void 0 ? void 0 : _b.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const match = e.target.value.match(/^\d*$/);
        if (match) {
            const num = parseInt(match[0]);
            if (num > 0 && num <= numPages) {
                renderPage((pageNum = num));
            }
        }
    }
});
(_c = document.getElementById("page_num")) === null || _c === void 0 ? void 0 : _c.addEventListener("blur", (e) => {
    const match = e.target.value.match(/^\d*$/);
    if (match) {
        const num = parseInt(match[0]);
        if (num > 0 && num <= numPages) {
            renderPage((pageNum = num));
        }
    }
});
