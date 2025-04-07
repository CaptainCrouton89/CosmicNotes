export class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class UserError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
    this.name = "UserError";
  }
}
