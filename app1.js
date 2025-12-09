// // app.js — Snap2Pdf Ultra-Fast + Force-Share + Fit + Compression + Chunked
// let pickedImages = [];
// let pdfSize = "a4";

// // ---------- CONFIG ----------
// const DEFAULT_MAX_DIM = 1500;   // recommended max pixel dimension for longest side
// const DEFAULT_QUALITY = 0.85;   // JPEG quality: 0.5 .. 1
// const CHUNK_SIZE = 20;          // number of images per chunk
// const MIN_TICK = 3;             // ms to yield to UI between images

// // ---------- DOM refs ----------
// const inputEl = document.getElementById("imagePicker");
// const toastEl = document.getElementById("toast");
// const convertBtn = document.getElementById("convertBtn");
// const hh11 = document.getElementById("hh11");
// const sizeButtons = document.getElementById("sizeButtons");

// // ---------- Toast ----------
// function showToast(msg = "", duration = 1800) {
//     if (!toastEl) return;
//     toastEl.innerText = msg;
//     toastEl.classList.add("show");
//     clearTimeout(showToast._t);
//     showToast._t = setTimeout(() => toastEl.classList.remove("show"), duration);
// }
// function setStatus(text = "") {
//     if (!hh11) return;
//     hh11.innerText = text;
// }

// // ---------- File select ----------
// inputEl.addEventListener("change", async (e) => {
//     pickedImages = Array.from(e.target.files || []);
//     setStatus("");
//     showToast(`Selected ${pickedImages.length} photos`);
//     await new Promise(r => setTimeout(r, 40));
// });

// // ---------- Size buttons ----------
// sizeButtons.addEventListener("click", (ev) => {
//     const btn = ev.target.closest(".size-btn");
//     if (!btn) return;
//     document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
//     btn.classList.add("active");
//     pdfSize = btn.dataset.size || "a4";
// });

// // ---------- Helpers ----------
// function fileToDataURL(file) {
//     return new Promise((res, rej) => {
//         const reader = new FileReader();
//         reader.onload = () => res(reader.result);
//         reader.onerror = rej;
//         reader.readAsDataURL(file);
//     });
// }
// function loadImage(src) {
//     return new Promise((res, rej) => {
//         const img = new Image();
//         img.onload = () => res(img);
//         img.onerror = rej;
//         img.crossOrigin = "anonymous";
//         img.src = src;
//     });
// }
// const reuseCanvas = document.createElement("canvas");
// const reuseCtx = reuseCanvas.getContext("2d");
// function compressImageToDataURL(img, maxDim, quality) {
//     let w = img.width;
//     let h = img.height;
//     const ratio = Math.min(maxDim / w, maxDim / h, 1);
//     w = Math.round(w * ratio);
//     h = Math.round(h * ratio);
//     reuseCanvas.width = w;
//     reuseCanvas.height = h;
//     reuseCtx.clearRect(0, 0, w, h);
//     reuseCtx.drawImage(img, 0, 0, w, h);
//     return reuseCanvas.toDataURL("image/jpeg", quality);
// }
// async function processImageFile(file, maxDim, quality) {
//     const dataUrl = await fileToDataURL(file);
//     const img = await loadImage(dataUrl);
//     return compressImageToDataURL(img, maxDim, quality);
// }

// // ---------- Fit page size ----------
// const FIT_MAX_DIM = 2500;
// function calcFitPageSize(imgW, imgH, uiMax) {
//     const maxDim = Math.max(imgW, imgH);
//     const cap = Math.min(FIT_MAX_DIM, uiMax || DEFAULT_MAX_DIM);
//     if (maxDim <= cap) return [imgW, imgH];
//     const scale = cap / maxDim;
//     return [Math.round(imgW * scale), Math.round(imgH * scale)];
// }

// // ---------- Main PDF creation ----------
// convertBtn.addEventListener("click", async () => {
//     try {
//         if (!pickedImages.length) {
//             showToast("Please select photos first", 2000);
//             return;
//         }

//         const maxDimInput = document.getElementById("maxDim");
//         const qualityInput = document.getElementById("quality");
//         const uiMax = maxDimInput ? Math.max(600, Math.min(4000, Number(maxDimInput.value) || DEFAULT_MAX_DIM)) : DEFAULT_MAX_DIM;
//         const uiQuality = qualityInput ? Math.max(0.5, Math.min(1, Number(qualityInput.value) || DEFAULT_QUALITY)) : DEFAULT_QUALITY;

//         setStatus("");
//         showToast("Preparing PDF...");

//         const { jsPDF } = window.jspdf;
//         let pdf;
//         let pageW, pageH;

//         // FIT mode
//         if (pdfSize === "fit") {
//             setStatus("Processing first image for Fit...");
//             const firstCompressed = await processImageFile(pickedImages[0], uiMax, uiQuality);
//             const firstImg = await loadImage(firstCompressed);
//             [pageW, pageH] = calcFitPageSize(firstImg.width, firstImg.height, uiMax);
//             pdf = new jsPDF({ unit: "px", format: [pageW, pageH], compress: true, worker: true });

//             const scale = Math.min(pageW / firstImg.width, pageH / firstImg.height, 1);
//             const w = Math.round(firstImg.width * scale);
//             const h = Math.round(firstImg.height * scale);
//             const x = Math.round((pageW - w) / 2);
//             const y = Math.round((pageH - h) / 2);
//             pdf.addImage(firstCompressed, "JPEG", x, y, w, h, undefined, "FAST");
//         } else {
//             pdf = new jsPDF({ unit: "px", format: pdfSize, compress: true, worker: true });
//             pageW = pdf.internal.pageSize.getWidth();
//             pageH = pdf.internal.pageSize.getHeight();
//         }

//         const total = pickedImages.length;
//         let processed = (pdfSize === "fit") ? 1 : 0;
//         const startIndex = (pdfSize === "fit") ? 1 : 0;

//         for (let s = startIndex; s < total; s += CHUNK_SIZE) {
//             const chunk = pickedImages.slice(s, s + CHUNK_SIZE);
//             for (let i = 0; i < chunk.length; i++) {
//                 const idx = s + i;
//                 setStatus(`Processing ${idx + 1} / ${total}`);
//                 try {
//                     const compressed = await processImageFile(chunk[i], uiMax, uiQuality);
//                     const img = await loadImage(compressed);
//                     const maxW = pageW - 20;
//                     const maxH = pageH - 20;
//                     const scale = Math.min(maxW / img.width, maxH / img.height, 1);
//                     const w = Math.round(img.width * scale);
//                     const h = Math.round(img.height * scale);
//                     const x = Math.round((pageW - w) / 2);
//                     const y = Math.round((pageH - h) / 2);

//                     if (!(pdfSize === "fit" && idx === 0)) pdf.addPage([pageW, pageH]);
//                     pdf.addImage(compressed, "JPEG", x, y, w, h, undefined, "FAST");
//                 } catch (err) {
//                     console.warn("Skipping image due to error:", err);
//                 }

//                 processed++;
//                 const percent = Math.round((processed / total) * 100);
//                 showToast(`Creating PDF... ${percent}%`, 1000);

//                 await new Promise(r => setTimeout(r, MIN_TICK));
//             }
//             await new Promise(r => setTimeout(r, 60));
//         }

//         setStatus("Finalizing PDF...");
//         showToast("Finalizing PDF...", 800);

//         const blob = pdf.output("blob");
//         const pdfFile = new File([blob], "Snap2Pdf_compressed.pdf", { type: "application/pdf" });

//         showToast("PDF is ready!", 1200);
//         setStatus("");

//         // ---------- Force Share ----------
//         try {
//             if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
//                 await navigator.share({ files: [pdfFile], title: "Snap2Pdf", text: "Here is your PDF" });
//             } else {
//                 pdf.save("Snap2Pdf_compressed.pdf");
//             }
//         } catch (e) {
//             console.warn("Share failed, fallback to save", e);
//             pdf.save("Snap2Pdf_compressed.pdf");
//         }

//     } catch (err) {
//         console.error("Unexpected error:", err);
//         showToast("Error occurred. See console.", 2000);
//         setStatus("");
//     }
// });



// // manifest

// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('service-worker.js')
//             .then(reg => console.log('Service Worker registered:', reg))
//             .catch(err => console.error('Service Worker registration failed:', err));
//     });
// }









































// // app.js — Snap2Pdf Ultra-Fast + High-Quality + Parallel + Fit + Compression
// let pickedImages = [];
// let pdfSize = "a4";

// // ---------- CONFIG ----------
// const DEFAULT_MAX_DIM = 2000;   // max pixel dimension
// const DEFAULT_QUALITY = 0.9;    // JPEG quality
// const PARALLEL_CONCURRENCY = 4; // images processed at same time
// const MIN_TICK = 10;             // ms to yield to UI

// // ---------- DOM refs ----------
// const inputEl = document.getElementById("imagePicker");
// const toastEl = document.getElementById("toast");
// const convertBtn = document.getElementById("convertBtn");
// const hh11 = document.getElementById("hh11");
// const sizeButtons = document.getElementById("sizeButtons");

// // ---------- Toast ----------
// function showToast(msg = "", duration = 1800) {
//     if (!toastEl) return;
//     toastEl.innerText = msg;
//     toastEl.classList.add("show");
//     clearTimeout(showToast._t);
//     showToast._t = setTimeout(() => toastEl.classList.remove("show"), duration);
// }
// function setStatus(text = "") {
//     if (!hh11) return;
//     hh11.innerText = text;
// }

// // ---------- File select ----------
// inputEl.addEventListener("change", async (e) => {
//     pickedImages = Array.from(e.target.files || []);
//     setStatus("");
//     showToast(`Selected ${pickedImages.length} photos`);
//     await new Promise(r => setTimeout(r, 40));
// });

// // ---------- Size buttons ----------
// sizeButtons.addEventListener("click", (ev) => {
//     const btn = ev.target.closest(".size-btn");
//     if (!btn) return;
//     document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
//     btn.classList.add("active");
//     pdfSize = btn.dataset.size || "a4";
// });

// // ---------- Helpers ----------
// function fileToDataURL(file) {
//     return new Promise((res, rej) => {
//         const reader = new FileReader();
//         reader.onload = () => res(reader.result);
//         reader.onerror = rej;
//         reader.readAsDataURL(file);
//     });
// }
// function loadImage(src) {
//     return new Promise((res, rej) => {
//         const img = new Image();
//         img.onload = () => res(img);
//         img.onerror = rej;
//         img.crossOrigin = "anonymous";
//         img.src = src;
//     });
// }

// // ---------- Canvas compression ----------
// function compressImageToDataURL(img, maxDim, quality) {
//     let w = img.width;
//     let h = img.height;
//     const ratio = Math.min(maxDim / w, maxDim / h, 1);
//     w = Math.round(w * ratio);
//     h = Math.round(h * ratio);

//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     canvas.width = w;
//     canvas.height = h;
//     ctx.clearRect(0, 0, w, h);
//     ctx.drawImage(img, 0, 0, w, h);
//     return canvas.toDataURL("image/jpeg", quality);
// }

// // ---------- Parallel image processing ----------
// async function processImagesParallel(files, maxDim, quality, concurrency = PARALLEL_CONCURRENCY) {
//     const results = [];
//     let index = 0;

//     async function worker() {
//         while (index < files.length) {
//             const i = index++;
//             try {
//                 const dataUrl = await fileToDataURL(files[i]);
//                 const img = await loadImage(dataUrl);
//                 results[i] = compressImageToDataURL(img, maxDim, quality);
//             } catch (e) {
//                 console.warn("Skipping image", files[i].name, e);
//                 results[i] = null;
//             }
//         }
//     }

//     await Promise.all(Array(concurrency).fill().map(worker));
//     return results.filter(Boolean);
// }

// // ---------- Fit page size ----------
// const FIT_MAX_DIM = 2500;
// function calcFitPageSize(imgW, imgH, uiMax) {
//     const maxDim = Math.max(imgW, imgH);
//     const cap = Math.min(FIT_MAX_DIM, uiMax || DEFAULT_MAX_DIM);
//     if (maxDim <= cap) return [imgW, imgH];
//     const scale = cap / maxDim;
//     return [Math.round(imgW * scale), Math.round(imgH * scale)];
// }

// // ---------- Main PDF creation ----------
// convertBtn.addEventListener("click", async () => {
//     try {
//         if (!pickedImages.length) {
//             showToast("Please select photos first", 2000);
//             return;
//         }

//         if (!window.jspdf || !window.jspdf.jsPDF) {
//             showToast("jsPDF is not loaded!", 2000);
//             return;
//         }

//         const maxDimInput = document.getElementById("maxDim");
//         const qualityInput = document.getElementById("quality");
//         const uiMax = maxDimInput ? Math.max(600, Math.min(4000, Number(maxDimInput.value) || DEFAULT_MAX_DIM)) : DEFAULT_MAX_DIM;
//         const uiQuality = qualityInput ? Math.max(0.5, Math.min(1, Number(qualityInput.value) || DEFAULT_QUALITY)) : DEFAULT_QUALITY;

//         setStatus("");
//         showToast("Preparing PDF...");

//         let pdf;
//         let pageW, pageH;

//         // --------- Initialize PDF ---------
//         if (pdfSize === "fit") {
//             setStatus("Processing first image for Fit...");
//             const firstCompressed = await processImageFile(pickedImages[0], uiMax, uiQuality);
//             const firstImg = await loadImage(firstCompressed);
//             [pageW, pageH] = calcFitPageSize(firstImg.width, firstImg.height, uiMax);
//             pdf = new window.jspdf.jsPDF({ unit: "px", format: [pageW, pageH], compress: true, worker: true });

//             const scale = Math.min(pageW / firstImg.width, pageH / firstImg.height, 1);
//             const w = Math.round(firstImg.width * scale);
//             const h = Math.round(firstImg.height * scale);
//             const x = Math.round((pageW - w) / 2);
//             const y = Math.round((pageH - h) / 2);
//             pdf.addImage(firstCompressed, "JPEG", x, y, w, h, undefined, "FAST");
//         } else {
//             pdf = new window.jspdf.jsPDF({ unit: "px", format: pdfSize, compress: true, worker: true });
//             pageW = pdf.internal.pageSize.getWidth();
//             pageH = pdf.internal.pageSize.getHeight();
//         }

//         // --------- Process images in parallel ---------
//         setStatus("Processing images in parallel...");
//         const startIndex = pdfSize === "fit" ? 1 : 0;
//         const compressedImages = await processImagesParallel(pickedImages.slice(startIndex), uiMax, uiQuality, PARALLEL_CONCURRENCY);

//         for (let idx = 0; idx < compressedImages.length; idx++) {
//             const dataUrl = compressedImages[idx];
//             const img = await loadImage(dataUrl);

//             const maxW = pageW - 20;
//             const maxH = pageH - 20;
//             const scale = Math.min(maxW / img.width, maxH / img.height, 1);
//             const w = Math.round(img.width * scale);
//             const h = Math.round(img.height * scale);
//             const x = Math.round((pageW - w) / 2);
//             const y = Math.round((pageH - h) / 2);

//             if (!(pdfSize === "fit" && idx === 0)) pdf.addPage([pageW, pageH]);
//             pdf.addImage(dataUrl, "JPEG", x, y, w, h, undefined, "FAST");

//             const percent = Math.round(((idx + startIndex + 1) / pickedImages.length) * 100);
//             showToast(`Creating PDF... ${percent}%`, 1000);
//             await new Promise(r => setTimeout(r, MIN_TICK));
//         }

//         // --------- Finalize PDF ---------
//         setStatus("Finalizing PDF...");
//         showToast("Finalizing PDF...", 800);

//         const blob = pdf.output("blob");
//         const pdfFile = new File([blob], "Snap2Pdf_compressed.pdf", { type: "application/pdf" });

//         showToast("PDF is ready!", 1200);
//         setStatus("");

//         // --------- Force Share / Save ---------
//         try {
//             if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
//                 await navigator.share({ files: [pdfFile] });
//             } else {
//                 pdf.save("Snap2Pdf_compressed.pdf");
//             }
//         } catch (e) {
//             console.warn("Share failed, fallback to save", e);
//             pdf.save("Snap2Pdf_compressed.pdf");
//         }

//     } catch (err) {
//         console.error("Unexpected error:", err);
//         showToast("Error occurred. See console.", 2000);
//         setStatus("");
//     }
// });

// // ---------- Service Worker ----------
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('service-worker.js')
//             .then(reg => console.log('Service Worker registered:', reg))
//             .catch(err => console.error('Service Worker registration failed:', err));
//     });
// }



































// app.js — Snap2Pdf Ultra-Fast + High-Quality + Parallel + Fit + Compression
let pickedImages = [];
let pdfSize = "a4";

// ---------- CONFIG ----------
const DEFAULT_MAX_DIM = 2000;   // max pixel dimension
const DEFAULT_QUALITY = 0.9;    // JPEG quality
const PARALLEL_CONCURRENCY = 4; // images processed at same time
const MIN_TICK = 10;            // ms to yield to UI
const FIT_MAX_DIM = 2500;

// ---------- DOM refs ----------
const inputEl = document.getElementById("imagePicker");
const toastEl = document.getElementById("toast");
const convertBtn = document.getElementById("convertBtn");
const hh11 = document.getElementById("hh11");
const sizeButtons = document.getElementById("sizeButtons");

// ---------- Toast ----------
function showToast(msg = "", duration = 1800) {
    if (!toastEl) return;
    toastEl.innerText = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), duration);
}
function setStatus(text = "") {
    if (!hh11) return;
    hh11.innerText = text;
}

// ---------- File select ----------
inputEl.addEventListener("change", async (e) => {
    pickedImages = Array.from(e.target.files || []);
    setStatus("");
    showToast(`Selected ${pickedImages.length} photos`);
    await new Promise(r => setTimeout(r, 40));
});

// ---------- Size buttons ----------
sizeButtons.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".size-btn");
    if (!btn) return;
    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    pdfSize = btn.dataset.size || "a4";
});

// ---------- Helpers ----------
function fileToDataURL(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.crossOrigin = "anonymous";
        img.src = src;
    });
}

// ---------- Single-image compression ----------
async function processImageFile(file, maxDim, quality) {
    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    return compressImageToDataURL(img, maxDim, quality);
}

// ---------- Canvas compression ----------
function compressImageToDataURL(img, maxDim, quality) {
    let w = img.width;
    let h = img.height;
    const ratio = Math.min(maxDim / w, maxDim / h, 1);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
}

// ---------- Parallel image processing ----------
async function processImagesParallel(files, maxDim, quality, concurrency = PARALLEL_CONCURRENCY) {
    const results = [];
    let index = 0;

    async function worker() {
        while (index < files.length) {
            const i = index++;
            try {
                const dataUrl = await fileToDataURL(files[i]);
                const img = await loadImage(dataUrl);
                results[i] = compressImageToDataURL(img, maxDim, quality);
            } catch (e) {
                console.warn("Skipping image", files[i].name, e);
                results[i] = null;
            }
        }
    }

    await Promise.all(Array(concurrency).fill().map(worker));
    return results.filter(Boolean);
}

// ---------- Fit page size ----------
function calcFitPageSize(imgW, imgH, uiMax) {
    const maxDim = Math.max(imgW, imgH);
    const cap = Math.min(FIT_MAX_DIM, uiMax || DEFAULT_MAX_DIM);
    if (maxDim <= cap) return [imgW, imgH];
    const scale = cap / maxDim;
    return [Math.round(imgW * scale), Math.round(imgH * scale)];
}

// ---------- Main PDF creation ----------
convertBtn.addEventListener("click", async () => {
    try {
        if (!pickedImages.length) {
            showToast("Please select photos first", 2000);
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            showToast("jsPDF is not loaded!", 2000);
            return;
        }

        const maxDimInput = document.getElementById("maxDim");
        const qualityInput = document.getElementById("quality");
        const uiMax = maxDimInput ? Math.max(600, Math.min(4000, Number(maxDimInput.value) || DEFAULT_MAX_DIM)) : DEFAULT_MAX_DIM;
        const uiQuality = qualityInput ? Math.max(0.5, Math.min(1, Number(qualityInput.value) || DEFAULT_QUALITY)) : DEFAULT_QUALITY;

        setStatus("");
        showToast("Preparing PDF...");

        let pdf;
        let pageW, pageH;

        // --------- FIT MODE ---------
        if (pdfSize === "fit") {
            setStatus("Processing first image for Fit...");
            const firstCompressed = await processImageFile(pickedImages[0], uiMax, uiQuality);
            const firstImg = await loadImage(firstCompressed);

            [pageW, pageH] = calcFitPageSize(firstImg.width, firstImg.height, uiMax);

            pdf = new window.jspdf.jsPDF({
                unit: "px",
                format: [pageW, pageH],
                compress: true,
                worker: true
            });

            const scale = Math.min(pageW / firstImg.width, pageH / firstImg.height, 1);
            const w = Math.round(firstImg.width * scale);
            const h = Math.round(firstImg.height * scale);
            const x = Math.round((pageW - w) / 2);
            const y = Math.round((pageH - h) / 2);

            pdf.addImage(firstCompressed, "JPEG", x, y, w, h, undefined, "FAST");
        }

        // --------- STANDARD SIZE ---------
        else {
            pdf = new window.jspdf.jsPDF({
                unit: "px",
                format: pdfSize,
                compress: true,
                worker: true
            });

            pageW = pdf.internal.pageSize.getWidth();
            pageH = pdf.internal.pageSize.getHeight();
        }

        // --------- Process images in parallel ---------
        setStatus("Processing images in parallel...");
        const startIndex = (pdfSize === "fit") ? 1 : 0;

        const compressedImages = await processImagesParallel(
            pickedImages.slice(startIndex),
            uiMax,
            uiQuality,
            PARALLEL_CONCURRENCY
        );

        for (let idx = 0; idx < compressedImages.length; idx++) {
            const dataUrl = compressedImages[idx];
            const img = await loadImage(dataUrl);

            const maxW = pageW - 20;
            const maxH = pageH - 20;
            const scale = Math.min(maxW / img.width, maxH / img.height, 1);

            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const x = Math.round((pageW - w) / 2);
            const y = Math.round((pageH - h) / 2);

            pdf.addPage([pageW, pageH]);
            pdf.addImage(dataUrl, "JPEG", x, y, w, h, undefined, "FAST");

            const percent = Math.round(((idx + startIndex + 1) / pickedImages.length) * 100);
            showToast(`Creating PDF... ${percent}%`, 1000);
            await new Promise(r => setTimeout(r, MIN_TICK));
        }

        // --------- Finalize PDF ---------
        setStatus("Finalizing PDF...");
        showToast("Finalizing PDF...", 800);

        const blob = pdf.output("blob");
        const pdfFile = new File([blob], "Snap2Pdf_compressed.pdf", { type: "application/pdf" });

        showToast("PDF is ready!", 1200);
        setStatus("");

        // --------- Share / Save ---------
        try {
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({ files: [pdfFile] });
            } else {
                pdf.save("Snap2Pdf_compressed.pdf");
            }
        } catch (e) {
            console.warn("Share failed, fallback to save", e);
            pdf.save("Snap2Pdf_compressed.pdf");
        }

    } catch (err) {
        console.error("Unexpected error:", err);
        showToast("Error occurred. See console.", 2000);
        setStatus("");
    }
});

// ---------- Service Worker ----------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}







































// let images = [];
// let selectedSize = "a4";

// const { jsPDF } = window.jspdf;

// function showToast(msg) {
//     const toast = document.getElementById("toast");
//     toast.textContent = msg;
//     toast.classList.add("show");
//     setTimeout(() => toast.classList.remove("show"), 2000);
// }

// document.getElementById("imagePicker").addEventListener("change", (e) => {
//     images = [...e.target.files];
//     document.getElementById("hh11").textContent = `${images.length} files selected`;
// });

// // size buttons
// document.querySelectorAll(".size-btn").forEach(btn => {
//     btn.addEventListener("click", () => {
//         document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
//         btn.classList.add("active");
//         selectedSize = btn.dataset.size;
//     });
// });

// document.getElementById("convertBtn").addEventListener("click", async () => {
//     if (images.length === 0) {
//         showToast("No file selected");
//         return;
//     }

//     const pdf = new jsPDF({
//         orientation: "p",
//         unit: "mm",
//         format: selectedSize === "fit" ? "a4" : selectedSize
//     });

//     for (let i = 0; i < images.length; i++) {

//         const img = await loadImage(images[i]);

//         // Resize (High quality)
//         const maxW = 2400;
//         const scale = maxW / img.width;

//         const canvas = document.createElement("canvas");
//         canvas.width = maxW;
//         canvas.height = img.height * scale;

//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//         const imgData = canvas.toDataURL("image/jpeg", 0.65);

//         if (i > 0) pdf.addPage();

//         const pageW = pdf.internal.pageSize.getWidth();
//         const pageH = pdf.internal.pageSize.getHeight();

//         let w = pageW;
//         let h = (canvas.height / canvas.width) * w;

//         if (h > pageH) {
//             h = pageH;
//             w = (canvas.width / canvas.height) * h;
//         }

//         pdf.addImage(imgData, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
//     }

//     const blob = pdf.output("blob");
//     const pdfFile = new File([blob], "converted.pdf", { type: "application/pdf" });

//     showToast("PDF created");

//     if (navigator.share) {
//         navigator.share({
//             files: [pdfFile]
//         }).catch(err => console.log(err));
//     }

//     pdf.save("snap2pdf.pdf");
// });

// // load image (base64)
// function loadImage(file) {
//     return new Promise((resolve) => {
//         const reader = new FileReader();
//         reader.onload = () => {
//             const img = new Image();
//             img.onload = () => resolve(img);
//             img.src = reader.result;
//         };
//         reader.readAsDataURL(file);
//     });
// }

// // ---------- Service Worker ----------
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('service-worker.js')
//             .then(reg => console.log('Service Worker registered:', reg))
//             .catch(err => console.error('Service Worker registration failed:', err));
//     });
// }