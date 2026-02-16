import React from 'react';
import { Provider } from 'react-redux';
import '@integrations/builder-legacy/i18n';
import BuilderApp from '@integrations/builder-legacy/App';
import { store } from '@integrations/builder-legacy/state';

export const V2BuilderView: React.FC = () => (
  <div className="min-h-full">
    <Provider store={store}>
      <BuilderApp />
    </Provider>
  </div>
);
