import React from 'react';
import { Provider } from 'react-redux';
import '../website/src/i18n';
import BuilderApp from '../website/src/App';
import { store } from '../website/src/state';

export const V2BuilderView: React.FC = () => (
  <div className="min-h-full">
    <Provider store={store}>
      <BuilderApp />
    </Provider>
  </div>
);
