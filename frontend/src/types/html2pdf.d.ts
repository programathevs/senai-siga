declare module "html2pdf.js" {
  export interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      letterRendering?: boolean;
      scrollY?: number;
      scrollX?: number;
      windowWidth?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string | [number, number];
      orientation?: "portrait" | "landscape";
    };
  }

  export interface Html2PdfWorker {
    from(element: HTMLElement | string): Html2PdfWorker;
    set(opt: Html2PdfOptions): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    outputPdf(type?: string): Promise<any>;
    toPdf(): Html2PdfWorker;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement | string, opt?: Html2PdfOptions): Promise<any>;

  export default html2pdf;
}
