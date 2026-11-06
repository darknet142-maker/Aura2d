export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Alerte dès qu'un fichier dépasse 250 lignes (hors lignes vides et commentaires)
      "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }],
      // Alerte dès qu'un composant ou une fonction dépasse 80 lignes
      "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true, skipComments: true }],
      // Limite l'imbrication de conditions (if/else/switch)
      "complexity": ["warn", 12],
    },
  },
];
