import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { readFileSync } from "node:fs"

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version)
	},
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src")
		}
	}
})
