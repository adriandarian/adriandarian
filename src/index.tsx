import React, { FC } from "react";
import ReactDOM from "react-dom";
import { createHashHistory } from "history";
import { Router, Switch, Route } from "react-router";

import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound/NotFound";

import "./index.css";

const history = createHashHistory({
    basename: "",
    hashType: "noslash",
    getUserConfirmation: (message, callback) =>
        callback(window.confirm(message)),
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

ReactDOM.render(<App />, document.getElementById("root"));
