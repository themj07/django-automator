  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [react()],
    base: "/django-automator/", 
    server: {
      proxy: {
        // Any request starting with /api will be proxied
        '/api': {
          // Change this target to the actual URL of your Node.js backend server
          target: 'http://localhost:5000',
          changeOrigin: true,
          // Optional: rewrite the path if your backend expects /models instead of /api/models
          // In your case, since your Express routes are /api/models and /api/views, 
          // you likely don't need rewrite:
          // rewrite: (path) => path.replace(/^\/api/, '') 
        },
      },
    },
  })