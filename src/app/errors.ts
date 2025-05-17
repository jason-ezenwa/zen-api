class CustomError extends Error {
  public statusCode: number;
  public message: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(404, message);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnprocessableContentError extends CustomError {
  constructor(message: string) {
    super(422, message);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string) {
    super(401, message);
  }
}