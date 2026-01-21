import React from 'react';
import { Provider } from 'react-redux';
import 'emoji-mart/css/emoji-mart.css';
import 'components-sdk/components-sdk.css';
import '../website/src/index.css';
import '../website/src/slider.css';
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
