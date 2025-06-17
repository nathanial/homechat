import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
    resolve: {
        alias: {
            '@homechat/shared': path.resolve(__dirname, '../shared/src/index.ts')
        }
    },
    server: {
        port: 3000
    },
    build: {
        ssr: true,
        target: 'node18',
        outDir: 'dist',
        rollupOptions: {
            external: [
                /^node:/,
                'express',
                'cors',
                'helmet',
                'bcryptjs',
                'jsonwebtoken',
                'sqlite3',
                'socket.io',
                'dotenv',
                'express-rate-limit'
            ]
        }
    }
});
//# sourceMappingURL=vite.config.js.map