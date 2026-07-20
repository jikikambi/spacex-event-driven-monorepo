import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { ApplicationProvider } from './presentation/application/ApplicationProvider';
import App from './app/app';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render( 

  <StrictMode>

    <ApplicationProvider>

            <App />

        </ApplicationProvider>

  </StrictMode>
);