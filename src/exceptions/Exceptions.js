
export class DisplayAsMainAlertError extends Error {
  constructor(message) {
    super(message);
    this.name = "DisplayAsMainAlertError";
  }
}

export class UiError extends Error {
  constructor(message) {
    super(message);
    this.name = "UiError";
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

export class InternalServerError extends Error {
  constructor() {
    super("Something went wrong. Please try again or contact the developer!");
    this.name = "InternalServerError";
  }
}

export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}
