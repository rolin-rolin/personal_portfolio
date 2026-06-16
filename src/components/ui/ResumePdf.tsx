"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function ResumePdf({ file, width }: { file: string; width: number }) {
    return (
        <Document file={file} loading={null} error={null}>
            <Page
                pageNumber={1}
                width={width}
                renderTextLayer={false}
                loading={null}
            />
        </Document>
    );
}
