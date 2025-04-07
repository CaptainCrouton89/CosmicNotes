export class ApplicationError extends Error {
  constructor(
    message: string,
    public data: Record<string, string | number | boolean | null | Error> = {}
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class UserError extends Error {
  constructor(
    message: string,
    public data: Record<string, string | number | boolean | null | Error> = {}
  ) {
    super(message);
    this.name = "UserError";
  }
}
