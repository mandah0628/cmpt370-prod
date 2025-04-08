import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_EXPRESS_BASE_URL || 'http://localhost:5050',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api; 