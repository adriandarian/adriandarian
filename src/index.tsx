import React, { FC } from 'react';
import ReactDOM from 'react-dom';
import { createHashHistory } from 'history';
import { Router, Switch, Route } from 'react-router';

import Home from './pages/Home/Home';
import NotFound from './pages/NotFound/NotFound';
import * as serviceWorker from './serviceWorker';
import reportWebVitals from './reportWebVitals';

import './index.css';

const history = createHashHistory({
  basename: '',
  hashType: 'noslash',
  getUserConfirmation: (message, callback) => callback(window.confirm(message)),
});

const App: FC = (): JSX.Element => {
  return (
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="*" component={NotFound} />
      </Switch>
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);