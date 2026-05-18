export const getEmployerToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return localStorage.getItem('employerToken') || user?.access_token || user?.token || localStorage.getItem('token') || null;
  } catch (error) {
    return localStorage.getItem('employerToken') || localStorage.getItem('token') || null;
  }
};

export const clearEmployerAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('employerToken');
  localStorage.removeItem('employerCompany');
};