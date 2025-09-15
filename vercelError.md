[18:58:22.559] Running build in Washington, D.C., USA (East) – iad1
[18:58:22.560] Build machine configuration: 2 cores, 8 GB
[18:58:22.582] Cloning github.com/vitalstepagency/Zephra (Branch: main, Commit: ada4467)
[18:58:23.045] Cloning completed: 463.000ms
[18:58:24.236] Skipping build cache since Node.js version changed from "22.x" to "20.x"
[18:58:24.469] Running "vercel build"
[18:58:24.877] Vercel CLI 47.1.1
[18:58:25.215] Warning: Due to "engines": { "node": "20.x" } in your `package.json` file, the Node.js Version defined in your Project Settings ("22.x") will not apply, Node.js Version "20.x" will be used instead. Learn More: http://vercel.link/node-version
[18:58:25.227] Running "install" command: `npm install`...
[18:58:29.981] npm warn deprecated @supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package instead.
[18:58:30.153] npm warn deprecated @supabase/auth-helpers-react@0.5.0: This package is now deprecated - please use the @supabase/ssr package instead.
[18:58:30.625] npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package instead.
[18:58:41.609] 
[18:58:41.610] added 476 packages, and audited 477 packages in 16s
[18:58:41.611] 
[18:58:41.611] 81 packages are looking for funding
[18:58:41.612]   run `npm fund` for details
[18:58:41.612] 
[18:58:41.612] found 0 vulnerabilities
[18:58:41.632] Detected Next.js version: 15.5.3
[18:58:41.633] Running "npm run build"
[18:58:41.792] 
[18:58:41.793] > digital-marketing-platform@1.0.0 prebuild
[18:58:41.793] > npm run security:check
[18:58:41.793] 
[18:58:41.921] 
[18:58:41.922] > digital-marketing-platform@1.0.0 security:check
[18:58:41.922] > echo 'Security check temporarily disabled' && exit 0
[18:58:41.922] 
[18:58:41.927] Security check temporarily disabled
[18:58:41.933] 
[18:58:41.934] > digital-marketing-platform@1.0.0 build
[18:58:41.934] > next build
[18:58:41.934] 
[18:58:42.568] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[18:58:42.569] This information is used to shape Next.js' roadmap and prioritize features.
[18:58:42.569] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[18:58:42.569] https://nextjs.org/telemetry
[18:58:42.569] 
[18:58:42.623]    ▲ Next.js 15.5.3
[18:58:42.624] 
[18:58:42.713]    Creating an optimized production build ...
[18:58:55.474] <w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (128kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
[18:58:55.678] Failed to compile.
[18:58:55.678] 
[18:58:55.679] src/app/layout.tsx
[18:58:55.679] An error occurred in `next/font`.
[18:58:55.679] 
[18:58:55.680] Error: Cannot find module 'autoprefixer'
[18:58:55.680] Require stack:
[18:58:55.680] - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
[18:58:55.681] - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js
[18:58:55.681] - /vercel/path0/node_modules/next/dist/build/webpack/config/index.js
[18:58:55.682] - /vercel/path0/node_modules/next/dist/build/webpack-config.js
[18:58:55.682] - /vercel/path0/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
[18:58:55.682] - /vercel/path0/node_modules/next/dist/build/collect-build-traces.js
[18:58:55.683] - /vercel/path0/node_modules/next/dist/build/index.js
[18:58:55.683] - /vercel/path0/node_modules/next/dist/cli/next-build.js
[18:58:55.683]     at Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
[18:58:55.684]     at /vercel/path0/node_modules/next/dist/server/require-hook.js:57:36
[18:58:55.684]     at Function.resolve (node:internal/modules/helpers:193:19)
[18:58:55.684]     at loadPlugin (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:53:32)
[18:58:55.684]     at /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:185:56
[18:58:55.684]     at Array.map (<anonymous>)
[18:58:55.684]     at getPostCssPlugins (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:185:47)
[18:58:55.684]     at async /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js:125:36
[18:58:55.684] 
[18:58:55.684] src/app/layout.tsx
[18:58:55.685] An error occurred in `next/font`.
[18:58:55.685] 
[18:58:55.685] Error: Cannot find module 'autoprefixer'
[18:58:55.685] Require stack:
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/webpack/config/index.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/webpack-config.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/collect-build-traces.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/build/index.js
[18:58:55.685] - /vercel/path0/node_modules/next/dist/cli/next-build.js
[18:58:55.685]     at Module._resolveFilename (node:internal/modules/cjs/loader:1212:15)
[18:58:55.685]     at /vercel/path0/node_modules/next/dist/server/require-hook.js:57:36
[18:58:55.685]     at Function.resolve (node:internal/modules/helpers:193:19)
[18:58:55.686]     at loadPlugin (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:53:32)
[18:58:55.686]     at /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:185:56
[18:58:55.686]     at Array.map (<anonymous>)
[18:58:55.686]     at getPostCssPlugins (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:185:47)
[18:58:55.686]     at async /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js:125:36
[18:58:55.686] 
[18:58:55.686] ./src/app/auth/signin/page.tsx
[18:58:55.686] Module not found: Can't resolve '@/components/ui/button'
[18:58:55.686] 
[18:58:55.686] https://nextjs.org/docs/messages/module-not-found
[18:58:55.686] 
[18:58:55.686] ./src/app/auth/signin/page.tsx
[18:58:55.686] Module not found: Can't resolve '@/components/ui/card'
[18:58:55.686] 
[18:58:55.686] https://nextjs.org/docs/messages/module-not-found
[18:58:55.687] 
[18:58:55.687] ./src/app/auth/signin/page.tsx
[18:58:55.687] Module not found: Can't resolve '@/components/ui/input'
[18:58:55.687] 
[18:58:55.687] https://nextjs.org/docs/messages/module-not-found
[18:58:55.687] 
[18:58:55.688] 
[18:58:55.688] > Build failed because of webpack errors
[18:58:55.739] Error: Command "npm run build" exited with 1