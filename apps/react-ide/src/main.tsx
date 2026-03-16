import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { setupAxiosInterceptor } from '@org/react-data-access';
import App from './app/app';

setupAxiosInterceptor();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
