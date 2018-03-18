import React from 'react';

/* Here we import a module from the second project which should trigger
an error */
import ComponentC from 'first_project/Components/ComponentB';

class ComponentB extends React.Component {
    render() {
        return (
            <div>
                <div>This is Component B in Project 1</div>
                <ComponentC />
            </div>
        )
    }
}

export default ComponentB;