// types/pdf-parse.d.ts
declare module 'pdf-parse' {
    interface PDFData {
      text: string;
      numpages: number;
      numrender: number;
      info: {
        PDFFormatVersion: string;
        IsAcroFormPresent: boolean;
        IsXFAPresent: boolean;
        [key: string]: unknown;
      };
      metadata: unknown;
      version: string;
    }
  
    interface PDFOptions {
      pagerender?: (pageData: unknown) => string;
      max?: number;
    }
  
    function parse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
    
    namespace parse {
      export { parse };
    }
    
    export = parse;
  }