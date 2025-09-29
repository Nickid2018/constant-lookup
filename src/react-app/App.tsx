import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./components/index-page'),
  },
  {
    path: '/:domain',
    lazy: () => import('./components/detail-page'),
  },
  {
    path: '*',
    lazy: () => import('./components/404'),
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
