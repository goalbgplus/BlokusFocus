import { defineConfig } from 'vite';

// Use a repo-base for GitHub Pages production builds so asset paths resolve correctly.
// In development we keep base='/'. When running in CI or production build, set
// the base to the repository name path (e.g. '/BlokusFocus/').
const REPO_BASE = '/BlokusFocus/';
const isProd = process.env.NODE_ENV === 'production' || process.env.CI === 'true';

export default defineConfig({
	// Development server for LAN/mobile access
	server: {
		host: '0.0.0.0',
		port: 5173
	},
	// Use repo base only for production builds so GH Pages serves assets correctly
	base: isProd ? REPO_BASE : '/',
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
