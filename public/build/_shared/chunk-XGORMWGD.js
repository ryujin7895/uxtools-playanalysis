import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-WWEL7QKW.js";
import {
  createHotContext
} from "/build/_shared/chunk-FQLJGGLM.js";
import {
  require_react
} from "/build/_shared/chunk-2AFRYLX2.js";
import {
  __toESM
} from "/build/_shared/chunk-RODUX5XG.js";

// app/utils/theme-provider.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/utils/theme-provider.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
var _s2 = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/utils/theme-provider.tsx"
  );
  import.meta.hot.lastModified = "1741255187019.4268";
}
var Theme = /* @__PURE__ */ function(Theme2) {
  Theme2["DARK"] = "dark";
  Theme2["LIGHT"] = "light";
  return Theme2;
}({});
var ThemeContext = (0, import_react.createContext)(void 0);
function ThemeProvider({
  children,
  defaultTheme = Theme.LIGHT
}) {
  _s();
  const [theme, setTheme] = (0, import_react.useState)(() => {
    if (typeof window !== "undefined") {
      const storedTheme = window.localStorage.getItem("theme");
      if (storedTheme === Theme.DARK) {
        return Theme.DARK;
      }
      return Theme.LIGHT;
    }
    return Theme.LIGHT;
  });
  (0, import_react.useEffect)(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);
  (0, import_react.useEffect)(() => {
    if (!localStorage.getItem("theme")) {
      setTheme(Theme.LIGHT);
    }
  }, []);
  const value = {
    theme,
    setTheme
  };
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ThemeContext.Provider, { value, children }, void 0, false, {
    fileName: "app/utils/theme-provider.tsx",
    lineNumber: 74,
    columnNumber: 10
  }, this);
}
_s(ThemeProvider, "SVNrybXvIdFdMJI46YWt6aSlITo=");
_c = ThemeProvider;
function useTheme() {
  _s2();
  const context = (0, import_react.useContext)(ThemeContext);
  if (context === void 0) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
_s2(useTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
$RefreshReg$(_c, "ThemeProvider");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;

export {
  Theme,
  ThemeProvider,
  useTheme
};
//# sourceMappingURL=/build/_shared/chunk-XGORMWGD.js.map
