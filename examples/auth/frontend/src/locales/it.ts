export default {
  // Login page
  login: {
    email: "Email",
    password: "Password",
    submit: "Accedi",
    loading: "Caricamento...",
  },

  // Validation messages
  validation: {
    email: {
      invalid: "Indirizzo email non valido",
      required: "Email obbligatoria",
    },
    password: {
      required: "Password obbligatoria",
      minLength: "La password deve contenere almeno 12 caratteri",
      notStrong: "La password non soddisfa i requisiti di sicurezza",
      containsPersonalData:
        "La password non può contenere i tuoi dati personali",
      mismatch: "Le password non corrispondono",
      tooShort: "Deve contenere almeno 12 caratteri",
      noUppercase: "Deve contenere almeno una lettera maiuscola",
      noLowercase: "Deve contenere almeno una lettera minuscola",
      noNumber: "Deve contenere almeno un numero",
      noSpecialChar: "Deve contenere almeno un carattere speciale",
      commonPassword: "Questa password è troppo comune",
    },
    username: {
      invalid:
        "Username può contenere solo lettere, numeri, trattini e underscore (3-30 caratteri)",
    },
    token: {
      required: "Token obbligatorio",
    },
  },
};
