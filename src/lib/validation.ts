export default class Validation {
  private readonly message: string;
  private readonly status: boolean;
  /**
   *
   * @param message - The message for the validation
   * @param status - The status of the validation
   */
  constructor(message: string = '', status: boolean = true) {
    this.message = message;
    this.status = status;
  }

  getMessage(): string {
    return this.message;
  }

  getStatus(): boolean {
    return this.status;
  }
}
