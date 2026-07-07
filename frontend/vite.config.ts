import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import MotionResolver from 'motion-v/resolver'
import RadixVueResolver from 'radix-vue/resolver'

export default defineConfig({
    server: {
        host: '::',
        port: 8080,
        hmr: { overlay: false },
    },
    plugins: [
        vue(),
        Components({
            dts: true,
            resolvers: [
                MotionResolver(),
                RadixVueResolver(),
            ],
        }),
    ],
    resolve: {
        alias: [
            {
                find: '@',
                replacement: path.resolve(__dirname, 'src'),
            },
        ],
    },
    build: {
        outDir: './dist',
        emptyOutDir: true,
    },
})
