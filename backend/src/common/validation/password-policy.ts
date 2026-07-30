export const PASSWORD_PATTERN =
  /^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\p{N})(?=.*[^\p{L}\p{N}\s])\S{8,}$/u;

export const PASSWORD_VALIDATION_MESSAGE =
  "Please enter a password of at least 8 characters containing an uppercase letter, a lowercase letter, a number, and a symbol, with no spaces.";
