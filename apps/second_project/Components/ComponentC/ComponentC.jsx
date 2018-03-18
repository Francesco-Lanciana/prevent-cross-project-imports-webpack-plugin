import React from 'react';
import ComponentD from 'first_project/Components/ComponentD';

class ComponentC extends React.Component {
    render() {
        return (
            <div>
                <div>This is Component C in Project 2</div>
                <ComponentD />
            </div>
        )
    }
}

export default ComponentC;