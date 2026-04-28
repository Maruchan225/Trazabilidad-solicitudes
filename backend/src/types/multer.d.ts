declare module 'multer' {
  export function diskStorage(options: {
    destination?: (request: any, file: any, callback: (error: Error | null, destination: string) => void) => void;
    filename?: (request: any, file: any, callback: (error: Error | null, filename: string) => void) => void;
  }): any;
}
