export class HttpError extends Error {
  // https://expressjs.com/en/guide/error-handling.html
  // express' default error handler will look for this property
  // to determine the status code
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
