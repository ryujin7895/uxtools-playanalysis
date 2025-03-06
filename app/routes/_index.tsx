import type { MetaFunction } from "@remix-run/node";
import { Button, Card, Navbar } from "flowbite-react";
import { BoltIcon, BookOpenIcon, RocketLaunchIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme, Theme } from "~/utils/theme-provider";

export const meta: MetaFunction = () => {
  return [
    { title: "Play Analysis - Flowbite Demo" },
    { name: "description", content: "A Remix app using Flowbite design system" },
  ];
};

export default function Index() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar fluid rounded className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Navbar.Brand href="#">
          <img src="/logo-light.png" className="mr-3 h-6 sm:h-9 dark:hidden" alt="Remix Logo" />
          <img src="/logo-dark.png" className="mr-3 h-6 hidden sm:h-9 dark:block" alt="Remix Logo" />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            Remix + Flowbite
          </span>
        </Navbar.Brand>
        <div className="flex md:order-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
            aria-label="Toggle dark mode"
          >
            {theme === Theme.DARK ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </Navbar>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8 mt-8">
          <header className="text-center max-w-2xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
              Welcome to <span className="text-blue-600 dark:text-blue-500">Remix</span>
            </h1>
            <p className="mb-6 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
              Powered by Flowbite design system with typography and Heroicons
            </p>
            <p className="text-md font-medium text-gray-700 dark:text-gray-300">
              Current theme: <span className="font-bold">{theme === Theme.DARK ? "Dark" : "Light"}</span> mode
            </p>
          </header>
          
          <Card className="w-full max-w-2xl">
            <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              What's next?
            </h5>
            <div className="flow-root">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {resources.map((resource) => (
                  <li key={resource.href} className="py-3 sm:py-4">
                    <a 
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-4 group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 text-blue-600 dark:text-blue-400">
                          {resource.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {resource.text}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                        <Button size="sm" color="gray" pill>
                          Visit
                        </Button>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </main>
      
      <footer className="bg-white shadow dark:bg-gray-800 mt-8">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            Built with Flowbite and Remix
          </span>
          <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <a href="https://flowbite.com" className="mr-4 hover:underline md:mr-6">Flowbite</a>
            </li>
            <li>
              <a href="https://remix.run" className="hover:underline">Remix</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

const resources = [
  {
    href: "https://remix.run/start/quickstart",
    text: "Quick Start (5 min)",
    icon: <BoltIcon />,
  },
  {
    href: "https://remix.run/start/tutorial",
    text: "Tutorial (30 min)",
    icon: <RocketLaunchIcon />,
  },
  {
    href: "https://remix.run/docs",
    text: "Remix Docs",
    icon: <BookOpenIcon />,
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: <ChatBubbleLeftRightIcon />,
  },
];
