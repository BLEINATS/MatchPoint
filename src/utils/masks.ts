export const maskCEP = (value: string): string => {
  return value
    .replace(/\D/g, '') // Remove all non-digit characters
    .replace(/^(\d{5})(\d)/, '$1-$2') // Add hyphen after 5th digit
    .slice(0, 9); // Limit to 9 characters (XXXXX-XXX)
};

export const maskPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14); // (XX) XXXX-XXXX
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15); // (XX) XXXXX-XXXX
};

export const maskCPFOrCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length <= 11) {
    // CPF
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // CNPJ
  return cleaned
    .slice(0, 14) // Limita para 14 dígitos
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};
