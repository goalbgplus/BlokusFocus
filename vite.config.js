import { defineConfig } from 'vite'; export default defineConfig({
	// Development server for LAN/mobile access
	server: {
		host: '0.0.0.0',
		port: 5173
	},
	// Serve assets from root in dev and production
	base: '/',
	publicDir: 'public',
	build: {
		sourcemap: true,
		cssMinify: true,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) return 'vendor';
				}
			}
		}
	}
});
