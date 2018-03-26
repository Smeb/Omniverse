export const trimValidationMessage = (validationError: Error) => {
  return validationError.message.replace("Validation error: ", "");
}
