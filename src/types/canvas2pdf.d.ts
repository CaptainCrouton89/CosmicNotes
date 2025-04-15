declare module "canvas2pdf" {
  import { BlobStream } from "blob-stream";

  interface PdfContext {
    drawImage(
      image: HTMLCanvasElement,
      x: number,
      y: number,
      width: number,
      height: number
    ): void;
    end(): void;
    stream: BlobStream;
  }

  const canvas2pdf: (stream: BlobStream) => PdfContext;
  export default canvas2pdf;
}

declare module "blob-stream" {
  export interface BlobStream {
    on(event: "finish", callback: () => void): void;
    toBlob(type: string): Blob;
  }

  function blobStream(): BlobStream;
  export default blobStream;
}
