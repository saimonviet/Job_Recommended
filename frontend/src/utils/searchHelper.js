const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(String(value).replace(/[^0-9]+/g, ''));
  return Number.isNaN(number) ? null : number;
};

export const buildJobSearchParams = ({
  query,
  searchQuery,
  searchTerm,
  filterLocation,
  filterSalary,
  salaryMin,
  salaryMax,
  filterExperience,
  filterIndustry,
  page = 1,
  perPage = 6,
}) => {
  const params = {
    page,
    per_page: 6,
  };

  const text = query ?? searchQuery ?? searchTerm;
  if (text) params.search = String(text).trim();
  if (filterLocation) params.location = filterLocation;

  const minSalary = parseNumber(salaryMin);
  const maxSalary = parseNumber(salaryMax);
  if (minSalary !== null) params.salary_min = minSalary;
  if (maxSalary !== null) params.salary_max = maxSalary;

  if (!Number.isFinite(minSalary) && typeof filterSalary === 'string' && filterSalary) {
    const [minStr, maxStr] = filterSalary.split('-');
    const parsedMin = parseNumber(minStr);
    const parsedMax = maxStr && maxStr !== '+' ? parseNumber(maxStr) : null;

    if (parsedMin !== null) params.salary_min = parsedMin * 1000000;
    if (parsedMax !== null) params.salary_max = parsedMax * 1000000;
  }

  if (filterExperience) {
    const expValue = String(filterExperience).trim();
    if (expValue === '0') {
      params.exp_min = 0;
      params.exp_max = 0;
    } else if (expValue === '1') {
      params.exp_min = 0;
      params.exp_max = 1;
    } else if (expValue === '3') {
      params.exp_min = 1;
      params.exp_max = 3;
    } else if (expValue === '5') {
      params.exp_min = 3;
      params.exp_max = 5;
    } else if (expValue === '10') {
      params.exp_min = 5;
    } else {
      const parsedExp = parseNumber(expValue);
      if (parsedExp !== null) params.exp_min = parsedExp;
    }
  }
  if (filterIndustry) params.industries = filterIndustry;

  return params;
};

export const buildCompanySearchParams = ({
  searchTerm,
  searchLocation,
  selectedLocation,
  sortBy = 'newest',
  page = 1,
  perPage = 6,
}) => {
  const params = {
    page,
    per_page: perPage,
    sort: sortBy,
  };

  if (searchTerm) params.search = String(searchTerm).trim();
  const location = searchLocation || selectedLocation;
  if (location) params.location = location;

  return params;
};

export const buildUserSearchParams = ({
  query,
  searchTerm,
  status,
  page = 1,
  perPage = 10,
}) => {
  const params = {
    page,
    per_page: perPage,
  };

  const text = query ?? searchTerm;
  if (text) params.search = String(text).trim();
  if (status) params.status = status;

  return params;
};
