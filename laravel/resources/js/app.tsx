import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { trackNavigation } from '@/lib/history';

const pages = import.meta.glob<{ default: ComponentType }>('./Pages/**/*.tsx');

// remember the previous page so "Back" buttons return where the shopper came from
trackNavigation();

createInertiaApp({
    title: (title) => (title ? `${title} · My Store` : 'My Store'),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        return page().then((module) => module.default);
    },
    setup({ el, App, props }) {
        createRoot(el!).render(<App {...props} />);
    },
});
