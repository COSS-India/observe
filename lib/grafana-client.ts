import axios from 'axios';

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_USERNAME = process.env.GRAFANA_USERNAME || 'admin';
const GRAFANA_PASSWORD = process.env.GRAFANA_PASSWORD || 'password';

if (!GRAFANA_URL) {
  console.error('Missing required environment variable: NEXT_PUBLIC_GRAFANA_URL');
}

if (!GRAFANA_USERNAME || !GRAFANA_PASSWORD) {
  console.error('Missing required environment variables: GRAFANA_USERNAME or GRAFANA_PASSWORD');
}

export const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  auth: {
    username: GRAFANA_USERNAME,
    password: GRAFANA_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

export default grafanaClient;
