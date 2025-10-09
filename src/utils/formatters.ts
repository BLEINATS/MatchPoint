export const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return '-';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
