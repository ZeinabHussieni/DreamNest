import React from 'react';
import ReactDOM from 'react-dom/client';
import './Assets/Styles/index.css';
import './Assets/Styles/variable.css';
import App from './App';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from './Context/AuthContext';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from './Context/ThemeContext';
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import { store } from './store/store';
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <AuthProvider>
    <BrowserRouter>
    <ToastContainer/>
    <ThemeProvider>

    <React.StrictMode>
 
    <Provider store={store}>
      <App />
    </Provider>
      
  </React.StrictMode>
  </ThemeProvider>
  </BrowserRouter>
  </AuthProvider>
);

