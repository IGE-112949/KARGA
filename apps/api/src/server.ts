import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = createApp({});

app.listen(config.PORT, () => {
  console.log(`API KARGA a correr em http://localhost:${config.PORT}`);
});
