/* Expected errors contain error messages which
 * can be sent to a client, as well as containing
 * the original error for logging.
 */

export default class ExpectedError extends Error {
  public readonly originalError: Error

  constructor(message, originalError) {
    super(message);
    this.originalError = originalError;
  }
}
