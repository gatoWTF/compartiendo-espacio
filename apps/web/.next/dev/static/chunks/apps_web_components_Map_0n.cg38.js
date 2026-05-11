(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/components/Map.js [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  {
    "path": "static/chunks/node_modules_leaflet_dist_leaflet_114-xrt.css",
    "included": [
      "[project]/node_modules/leaflet/dist/leaflet.css [app-client] (css)"
    ]
  },
  "static/chunks/node_modules_leaflet_dist_leaflet-src_0n13733.js",
  "static/chunks/apps_web_components_Map_0867io7.js",
  "static/chunks/apps_web_components_Map_02z0n-4.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/apps/web/components/Map.js [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
]);