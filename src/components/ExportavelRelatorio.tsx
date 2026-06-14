"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

type Props = {
  nomeArquivo: string; // nome do PNG (o PDF reusa o mesmo nome com .pdf)
  children: React.ReactNode;
};

// Envolve o card de um relatório e oferece exportá-lo como PNG ou PDF
// (formatos práticos para mandar no WhatsApp / e-mail).
export function ExportavelRelatorio({ nomeArquivo, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState<"png" | "pdf" | null>(null);

  // Gera a imagem do card em alta resolução.
  async function gerarPng(): Promise<{
    dataUrl: string;
    largura: number;
    altura: number;
  } | null> {
    const node = cardRef.current;
    if (!node) return null;
    const escala = 2;
    const dataUrl = await toPng(node, {
      pixelRatio: escala,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    return {
      dataUrl,
      largura: node.offsetWidth * escala,
      altura: node.offsetHeight * escala,
    };
  }

  async function exportarPng() {
    setGerando("png");
    try {
      const img = await gerarPng();
      if (!img) return;
      const link = document.createElement("a");
      link.href = img.dataUrl;
      link.download = nomeArquivo;
      link.click();
    } finally {
      setGerando(null);
    }
  }

  async function exportarPdf() {
    setGerando("pdf");
    try {
      const img = await gerarPng();
      if (!img) return;
      const pdf = new jsPDF({
        orientation: img.largura >= img.altura ? "landscape" : "portrait",
        unit: "px",
        format: [img.largura, img.altura],
      });
      pdf.addImage(img.dataUrl, "PNG", 0, 0, img.largura, img.altura);
      pdf.save(nomeArquivo.replace(/\.png$/i, ".pdf"));
    } finally {
      setGerando(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={exportarPng}
          disabled={gerando !== null}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {gerando === "png" ? "Gerando…" : "Exportar PNG"}
        </button>
        <button
          type="button"
          onClick={exportarPdf}
          disabled={gerando !== null}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {gerando === "pdf" ? "Gerando…" : "Exportar PDF"}
        </button>
      </div>
      {/* Tudo aqui dentro entra na imagem/PDF exportado */}
      <div ref={cardRef} className="bg-white p-5">
        {children}
      </div>
    </div>
  );
}
