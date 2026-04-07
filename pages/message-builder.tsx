import dynamic from 'next/dynamic';
import { Provider } from 'react-redux';
import { store } from '@/src/features/message-builder/state';
import '@/src/features/message-builder/i18n';

const BuilderApp = dynamic(
    () => import('@/src/features/message-builder/App'),
    { ssr: false }
);

export default function MessageBuilderPage() {
    return (
        <Provider store={store}>
            <div className="flex flex-col h-[calc(100vh-64px)]">
                <BuilderApp />
            </div>
        </Provider>
    );
}
