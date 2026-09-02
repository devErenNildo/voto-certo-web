export const maskDate = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})\d+?$/, '$1');
};

export const parseDateToApi = (value: string) => {
  if (!value || value.length !== 10) return value;
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
};

export const parseDateFromApi = (value: string) => {
  if (!value || value.indexOf('-') === -1) return value;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2'); // Handles 8 and 9 digits
};

export const maskNumeric = (value: string) => {
  return value.replace(/\D/g, '');
};
