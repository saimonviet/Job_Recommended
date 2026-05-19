const API_URL = 'http://127.0.0.1:5000';

const getAuthToken = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.access_token || user?.token || localStorage.getItem('token') || localStorage.getItem('employerToken') || null;
    } catch (error) {
        return localStorage.getItem('token') || localStorage.getItem('employerToken') || null;
    }
};

const buildUrl = (endpoint, params = {}) => {
    const url = new URL(`${API_URL}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
        }
    });

    return url.toString();
};

const request = async (endpoint, options = {}) => {
    const url = options.params ? buildUrl(endpoint, options.params) : `${API_URL}${endpoint}`;
    const token = getAuthToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (headers['Content-Type'] === null) {
        delete headers['Content-Type'];
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text();

    if (!response.ok) {
        const message = payload?.error || payload?.message || response.statusText || `API Error: ${response.status}`;
        throw new Error(message);
    }

    return payload;
};

const api = {
    request,

    get(endpoint, config = {}) {
        return request(endpoint, { ...config, method: 'GET' }).then((data) => ({ data }));
    },

    post(endpoint, data, config = {}) {
        const body = data instanceof FormData || typeof data === 'string' ? data : JSON.stringify(data);
        return request(endpoint, { ...config, method: 'POST', body }).then((result) => ({ data: result }));
    },

    put(endpoint, data, config = {}) {
        const body = data instanceof FormData || typeof data === 'string' ? data : JSON.stringify(data);
        return request(endpoint, { ...config, method: 'PUT', body }).then((result) => ({ data: result }));
    },

    delete(endpoint, config = {}) {
        return request(endpoint, { ...config, method: 'DELETE' }).then((result) => ({ data: result }));
    },

    saveJob(jobId) {
        return request(`/seeker/saved-jobs/${jobId}`, {
            method: 'POST',
        });
    },

    unsaveJob(jobId) {
        return request(`/seeker/saved-jobs/${jobId}`, {
            method: 'DELETE',
        });
    },
};

export default api;
export { API_URL };