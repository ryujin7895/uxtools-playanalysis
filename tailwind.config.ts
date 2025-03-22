import type { Config } from "tailwindcss";
import {content, plugin} from 'flowbite-react/tailwind'


export default {
  content: [
    "./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}",
    content(),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(),
    require('flowbite-typography'),
  ],
  darkMode: 'class',
} satisfies Config