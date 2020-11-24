require("esbuild")
    .build({
        banner: "/*\n * Adrian Darian's Personal Website\n * Bundled with esbuild\n */",
        mainFields: ["main"],
        entryPoints: ["src/index.tsx"],
        metafile: "build/meta.json",
        define: { "process.env.NODE_ENV": '"production"' },
        bundle: true,
        minify: true,
        sourcemap: true,
        target: [
            "es2020",
            "chrome58",
            "firefox57",
            "safari11",
            "edge16",
            "node12.19.0",
        ],
        format: "iife",
        globalName: 'website.versions["0.1.0"]',
        loader: { ".data": "base64", ".png": "dataurl" },
        color: true,
        charset: "utf8",
        errorLimit: 0,
        logLevel: "info",
        outdir: "build",
        footer: "/* End of File */",
    })
    .catch(() => process.exit(1));