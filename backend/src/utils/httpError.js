// Error type that carries an HTTP status code (and optional extra details).
// Controllers throw it; the central error handler turns it into JSON.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
