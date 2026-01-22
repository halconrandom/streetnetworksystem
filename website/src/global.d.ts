export declare global {
  interface Window {
    uploadedFiles: {
      [name: string]: File
    }
  }

  interface NodeRequire {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ): {
      keys(): string[];
      (id: string): string;
    };
  }
}
