import html2pdf, { type Html2PdfOptions } from "html2pdf.js";

/**
 * Utilitário para imprimir um elemento DOM com fidelidade milimétrica A4
 * utilizando o mesmo motor de renderização do html2pdf.js.
 *
 * Elimina os problemas de cortes de cabeçalho, espaços em branco e
 * quebras de página do window.print() em Single Page Applications (SPAs).
 */
export async function printElementAsPdf(
  element: HTMLElement,
  customOptions?: Partial<Html2PdfOptions>
): Promise<void> {
  const defaultOptions: Html2PdfOptions = {
    margin: [6, 6, 6, 6] as [number, number, number, number],
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2.2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    ...customOptions,
  };

  try {
    // 1. Gera o PDF em memória como um Blob binário
    const blob: Blob = await html2pdf().set(defaultOptions).from(element).outputPdf("blob");
    const blobUrl = URL.createObjectURL(blob);

    // 2. Cria um iframe invisível para isolar a impressão da árvore DOM principal
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.border = "none";
    iframe.style.pointerEvents = "none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    // 3. Aguarda o carregamento do PDF no iframe e dispara o diálogo nativo
    iframe.onload = () => {
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            throw new Error("contentWindow indisponível");
          }
        } catch {
          // Fallback caso a sandbox do navegador restrinja a impressão via iframe de plugin PDF
          const printWindow = window.open(blobUrl, "_blank");
          if (printWindow) {
            printWindow.focus();
          }
        } finally {
          // Limpeza do iframe e liberação de memória após 2 minutos
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          }, 120000);
        }
      }, 350);
    };
  } catch (error) {
    console.error("Erro ao preparar impressão via PDF:", error);
    throw error;
  }
}
