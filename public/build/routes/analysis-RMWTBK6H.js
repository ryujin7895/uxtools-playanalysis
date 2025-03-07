import {
  AnalysisResults,
  SingleAppAnalysis
} from "/build/_shared/chunk-E2WWS2MJ.js";
import "/build/_shared/chunk-LYT6NCUF.js";
import "/build/_shared/chunk-YR5DUWXI.js";
import "/build/_shared/chunk-OPGM6WIO.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-WWEL7QKW.js";
import {
  createHotContext
} from "/build/_shared/chunk-FQLJGGLM.js";
import "/build/_shared/chunk-N4FG5RPV.js";
import {
  require_react
} from "/build/_shared/chunk-2AFRYLX2.js";
import {
  __toESM
} from "/build/_shared/chunk-RODUX5XG.js";

// app/routes/analysis.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/analysis.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/analysis.tsx"
  );
  import.meta.hot.lastModified = "1741277892957.8";
}
function Analysis() {
  _s();
  const [appInput, setAppInput] = (0, import_react.useState)({
    id: 1,
    value: "",
    error: ""
  });
  const [dateRange, setDateRange] = (0, import_react.useState)("");
  const [analysisResult, setAnalysisResult] = (0, import_react.useState)(null);
  const handleInputChange = (value) => {
    let error = "";
    if (!value) {
      error = "App ID or URL is required";
    } else if (!value.includes("com.") && !value.includes("play.google.com")) {
      error = "Invalid App ID or Play Store URL";
    }
    setAppInput({
      ...appInput,
      value,
      error
    });
  };
  const handleAddApp = () => {
  };
  const handleReset = () => {
    setAppInput({
      id: 1,
      value: "",
      error: ""
    });
    setDateRange("");
    setAnalysisResult(null);
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "container mx-auto px-4 py-8 space-y-8", children: !analysisResult ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(SingleAppAnalysis, { appInput, onInputChange: handleInputChange, dateRange, onDateRangeChange: setDateRange, onAddApp: handleAddApp, onAnalysisComplete: setAnalysisResult }, void 0, false, {
    fileName: "app/routes/analysis.tsx",
    lineNumber: 60,
    columnNumber: 26
  }, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AnalysisResults, { onReset: handleReset, appCount: 1, result: analysisResult }, void 0, false, {
    fileName: "app/routes/analysis.tsx",
    lineNumber: 60,
    columnNumber: 222
  }, this) }, void 0, false, {
    fileName: "app/routes/analysis.tsx",
    lineNumber: 59,
    columnNumber: 10
  }, this);
}
_s(Analysis, "NpGXRIeU3D/8x/cCxhYiXlgdefA=");
_c = Analysis;
var _c;
$RefreshReg$(_c, "Analysis");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  Analysis as default
};
//# sourceMappingURL=/build/routes/analysis-RMWTBK6H.js.map
