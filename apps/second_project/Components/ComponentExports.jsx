import React from 'react';
import ReactDOM from "react-dom";

import ComponentC from 'second_project/Components/ComponentC';
import ComponentD from 'second_project/Components/ComponentD';

const rootElement = document.getElementById("root");

/* This is a useful function when we first need to authenticate a user before
showing the application */
const renderApp = (Component) => {
    ReactDOM.render(
        <Component />,
	    rootElement
    );
};

renderApp(ComponentC);

/* When  used with the 'library' option in webpack this exposes components from 
the bundle so that other bundles can use them */
export { ComponentC, ComponentD };


