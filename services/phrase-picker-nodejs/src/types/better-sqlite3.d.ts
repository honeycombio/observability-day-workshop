declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
  }

  interface Statement {
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): { changes: number; lastInsertRowid: number };
  }

  function Database(path: string, options?: { readonly?: boolean }): Database;
  export = Database;
}
