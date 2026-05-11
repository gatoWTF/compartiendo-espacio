(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/components/Map.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MapComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function MapComponent({ parkings = [], focusedSpot = null, onUserLocate = null }) {
    _s();
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const markersLayer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const userMarkerLayer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isLocating, setIsLocating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapComponent.useEffect": ()=>{
            if (!mapInstance.current && mapRef.current) {
                mapInstance.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].map(mapRef.current, {
                    preferCanvas: true,
                    zoomControl: false
                }).setView([
                    -33.4489,
                    -70.6693
                ], 13);
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '©OpenStreetMap'
                }).addTo(mapInstance.current);
                markersLayer.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].layerGroup().addTo(mapInstance.current);
                userMarkerLayer.current = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].layerGroup().addTo(mapInstance.current);
            }
            if (markersLayer.current && mapInstance.current) {
                markersLayer.current.clearLayers();
                parkings.forEach({
                    "MapComponent.useEffect": (p)=>{
                        const isFull = p.occupied_spots >= p.total_spots;
                        const markerColor = isFull ? '#ef4444' : '#10b981';
                        const isFocused = focusedSpot && focusedSpot.id === p.id;
                        const customIcon = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].divIcon({
                            className: 'custom-pin',
                            html: `<div style="background-color: ${markerColor}; width: ${isFocused ? '34px' : '28px'}; height: ${isFocused ? '34px' : '28px'}; border-radius: 50%; border: ${isFocused ? '4px' : '3px'} solid white; box-shadow: 0 0 ${isFocused ? '20px' : '10px'} ${markerColor}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"><i class="fa-solid fa-car" style="color: white; font-size: ${isFocused ? '14px' : '12px'};"></i></div>`,
                            iconSize: isFocused ? [
                                34,
                                34
                            ] : [
                                28,
                                28
                            ],
                            iconAnchor: isFocused ? [
                                17,
                                17
                            ] : [
                                14,
                                14
                            ]
                        });
                        const marker = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                            p.lat,
                            p.lng
                        ], {
                            icon: customIcon
                        }).bindPopup(`<strong style="color:#333;">${p.nombre}</strong><br/><span style="color:${markerColor}">${isFull ? 'LLENO' : 'Disponible'}</span>`).addTo(markersLayer.current);
                        if (isFocused) marker.openPopup();
                    }
                }["MapComponent.useEffect"]);
            }
        }
    }["MapComponent.useEffect"], [
        parkings,
        focusedSpot
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapComponent.useEffect": ()=>{
            if (focusedSpot && mapInstance.current) {
                mapInstance.current.flyTo([
                    focusedSpot.lat,
                    focusedSpot.lng
                ], 17, {
                    animate: true,
                    duration: 1.2
                });
            }
        }
    }["MapComponent.useEffect"], [
        focusedSpot
    ]);
    const locateUser = ()=>{
        if (!navigator.geolocation) {
            alert("GPS no soportado.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition((pos)=>{
            const { latitude, longitude } = pos.coords;
            if (onUserLocate) onUserLocate({
                lat: latitude,
                lng: longitude
            });
            mapInstance.current.flyTo([
                latitude,
                longitude
            ], 16, {
                animate: true,
                duration: 1.5
            });
            userMarkerLayer.current.clearLayers();
            const userIcon = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].divIcon({
                className: 'user-gps-pin',
                html: `<div style="position: relative; width: 20px; height: 20px;"><div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; border: 3px solid white; z-index: 2;"></div><div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; animation: pulseRing 1.5s infinite; z-index: 1;"></div></div>`,
                iconSize: [
                    20,
                    20
                ],
                iconAnchor: [
                    10,
                    10
                ]
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                latitude,
                longitude
            ], {
                icon: userIcon
            }).addTo(userMarkerLayer.current);
            setIsLocating(false);
        }, ()=>{
            alert("Permiso denegado.");
            setIsLocating(false);
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'relative',
            width: '100%',
            height: '100%'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                dangerouslySetInnerHTML: {
                    __html: `
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }
      `
                }
            }, void 0, false, {
                fileName: "[project]/apps/web/components/Map.js",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: mapRef,
                style: {
                    width: '100%',
                    height: '100%',
                    zIndex: 1
                }
            }, void 0, false, {
                fileName: "[project]/apps/web/components/Map.js",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: locateUser,
                disabled: isLocating,
                style: {
                    position: 'absolute',
                    bottom: '30px',
                    right: '20px',
                    zIndex: 1000,
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '55px',
                    height: '55px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    cursor: isLocating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                },
                children: isLocating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                    className: "fa-solid fa-spinner fa-spin"
                }, void 0, false, {
                    fileName: "[project]/apps/web/components/Map.js",
                    lineNumber: 92,
                    columnNumber: 23
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                    className: "fa-solid fa-location-crosshairs"
                }, void 0, false, {
                    fileName: "[project]/apps/web/components/Map.js",
                    lineNumber: 92,
                    columnNumber: 73
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/components/Map.js",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/components/Map.js",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_s(MapComponent, "7/TmoopJKP18aVvbReOK09gjFog=");
_c = MapComponent;
var _c;
__turbopack_context__.k.register(_c, "MapComponent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/app/page.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$components$2f$Map$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/components/Map.js [app-client] (ecmascript)"); // ¡La ruta corregida!
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function HomePage() {
    _s();
    const [parkings, setParkings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            // El frontend SOLO habla con el BFF
            fetch('/api/proxy/bff/dashboard').then({
                "HomePage.useEffect": (res)=>res.json()
            }["HomePage.useEffect"]).then({
                "HomePage.useEffect": (data)=>setParkings(data.results || [])
            }["HomePage.useEffect"]).catch({
                "HomePage.useEffect": (err)=>console.error("Error cargando parkings:", err)
            }["HomePage.useEffect"]);
        }
    }["HomePage.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        style: {
            padding: '2rem',
            fontFamily: 'sans-serif'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "Parking's Together"
            }, void 0, false, {
                fileName: "[project]/apps/web/app/page.js",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$components$2f$Map$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                locations: parkings
            }, void 0, false, {
                fileName: "[project]/apps/web/app/page.js",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/app/page.js",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(HomePage, "si9mq6Z8JfOngOFqZu5F7fiYTIM=");
_c = HomePage;
var _c;
__turbopack_context__.k.register(_c, "HomePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_0kc5enl._.js.map