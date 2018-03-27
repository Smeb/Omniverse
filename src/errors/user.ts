/* Expected errors contain error messages which
 * can be sent to a client, as well as containing
 * the original error for logging.
 */

export default class UserError extends Error {
  public readonly originalError: Error

  constructor(message, originalError=null) {
    super(message);
    this.originalError = originalError;
  }
}
