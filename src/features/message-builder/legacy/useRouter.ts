import { useCallback, useEffect, useState } from 'react';
import { libs, supportedLngs, translatePath } from '../libs.config';

const isCrawler = () => {
    if (typeof navigator === 'undefined') return false;
    return /(bot|crawler|spider|crawling|google|baidu|bing|teoma|slurp|yandex)/.test(navigator.userAgent.toLowerCase());
};

const getBasePath = () => {
    const envBase = process.env.NEXT_PUBLIC_BUILDER_BASE_PATH;
    if (typeof envBase === 'string' && envBase.trim()) return envBase.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
        const windowBase = (window as any).__SN_BUILDER_BASE_PATH__;
        if (typeof windowBase === 'string' && windowBase.trim()) return windowBase.replace(/\/$/, '');
        if (window.location.pathname.startsWith('/message-builder')) return '/message-builder';
    }
    return '';
};

const allPages = Object.entries(libs).reduce((acc, [page, lib]) => {
    acc[lib.path] = page;
    for (const lang of supportedLngs) acc[translatePath(lang, lib.path)] = page;
    return acc;
}, {} as { [path: string]: string; });

for (const lang of supportedLngs) allPages[`/${lang}`] = '200.home';
allPages[''] = '200.home';
allPages['/'] = '200.home';


function findPath(page: string): string | null {
    if (page === "200.home") return '/';

    const libInfo = libs[page];
    if (typeof libInfo !== "undefined") return libInfo.path;

    return null;
}

function normalizePath(path: string): string {
    const basePath = getBasePath();
    let nextPath = path.replace(/\/$/, '');
    if (basePath && nextPath.startsWith(basePath)) {
        nextPath = nextPath.slice(basePath.length) || '/';
    }
    if (nextPath === '/') return '';
    return nextPath;
}

function findPage(path: string): string {
    const normalized = normalizePath(path);
    return allPages[normalized] || '404.not-found';
}

function firstLoadPage(): string {
    if (typeof window === 'undefined') return '200.home';
    const page = findPage(window.location.pathname);
    if (normalizePath(window.location.pathname) === "/" && !isCrawler()) {
        const cacheLib = localStorage.getItem("discord.builders__selectedLib");
        const libPath = cacheLib && findPath(cacheLib);
        if (libPath && libPath !== "/") {
            redirect(libPath);
            return cacheLib;
        }
    }

    return page
}

function redirect(path: string) {
    const basePath = getBasePath();
    const nextPath = basePath ? `${basePath}${path}` : path;
    history.replaceState(null, '', `${nextPath}${window.location.search}${window.location.hash}`);
}

export function useRouter(): [string, (page: string) => void] {
    const [pageInternal, setPageInternal] = useState(firstLoadPage);

    useEffect(() => {
        const handlePopState = () =>  setPageInternal(findPage(window.location.pathname));
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    const setPage = useCallback((page: string) => {
        setPageInternal(page);
        localStorage.setItem("discord.builders__selectedLib", page || '');

        const targetPath = findPath(page);
        if (targetPath !== null) redirect(targetPath);
    }, []);

    return [pageInternal, setPage]
}
