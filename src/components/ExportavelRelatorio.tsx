"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

type Props = {
  nomeArquivo: string;
  children: React.ReactNode;
};

// Envolve o card de um relatório e oferece um botão para exportá-lo como PNG
// (formato prático para colar no grupo do WhatsApp).
export function ExportavelRelatorio({ nomeArquivo, children }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);

  async function exportar() {
    if (!cardRef.current) return;
    setGerando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = nomeArquivo;
      link.click();
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          onClick={exportar}
          disabled={gerando}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {gerando ? "Gerando imagem…" : "Exportar PNG"}
        </button>
      </div>
      {/* Tudo aqui dentro entra na imagem exportada */}
      <div ref={cardRef} className="bg-white p-5">
        {children}
      </div>
    </div>
  );
}
