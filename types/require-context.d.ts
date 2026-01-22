declare global {
  interface Require {
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

export {};
