import React from 'react';
import ComponentB from 'first_project/Components/ComponentB';

class ComponentA extends React.Component {
    render() {
        return (
            <div>
                <div>This is Component A in Project 1</div>
                <ComponentB />
            </div>
        )
    }
}

export default ComponentA;