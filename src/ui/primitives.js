import React from "react";
import {renderImage} from "../draw/draw";
import {loadFile} from "../file/file";

export class Canvas extends React.Component {
    render() {
        return (
            <canvas id="glcanvas" width="640" height="480">
                Please use a browser that supports "canvas"
            </canvas>
        )
    }
}

export class LoadButton extends React.Component {
    updateFile = (value) => {
        this.props.updateData(value);
        if (value.isFileOpened === true) {
            renderImage();
        }
    }
    render() {
        return (
            <input type="file"
                   accept=".mesh, .msh, .vol, .qres"
                   onChange={(event) => {
                       if (event.target.files[0] === undefined) {
                           console.log("File is undefined!");
                           return;
                       }
                       loadFile(event.target.files[0]).then(this.updateFile).catch(() => {
                           alert("Failed to load file!")
                       });
                   }}
            />
        )
    }
}

export class RadioBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            name: props.name,
            checked: props.checked,
        };
    }

    render() {
        return (
            <label>
                <input type="radio"
                       value={this.state.value}
                       name={this.state.name}
                       defaultChecked={this.props.checked}
                       onChange={() => {
                           this.setState({checked: true});
                           this.props.updateData(this.state.value);
                       }}
                />
                {this.state.value}
            </label>
        );
    }
}

export class CheckBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            caption: props.caption,
            isChecked: props.isChecked,
        };
    }

    render() {
        return (
            <label>
                <input type="checkbox"
                       checked={this.state.isChecked}
                       onChange={() => {
                           this.setState({isChecked: !this.state.isChecked});
                           this.props.updateData(this.state.isChecked);
                       }}
                />
                {this.state.caption}
            </label>
        );
    }
}

// https://react.dev/reference/react-dom/components/input
// https://ru.legacy.reactjs.org/tutorial/tutorial.html
// https://ru.react.js.org/docs/getting-started.html

export class Slider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            min: props.min,
            max: props.max,
            step: props.step,
            value: props.value,
            caption: props.caption,
            enabled: props.enabled,
        };
    }
    render() {
        return (
            <div className={"field"}>
                <label>{this.state.caption}</label>
                <>
                    <input type="range"
                           min={this.state.min}
                           max={this.state.max}
                           step={this.state.step}
                           value={this.props.value}
                           disabled={!this.props.enabled}
                           onChange={(event) => {
                               this.setState({value: event.target.value});
                               this.props.updateData(event.target.value);
                           }}
                    />
                    {this.props.value}
                </>
            </div>
        );
    }
}

// Layout
// https://ru.stackoverflow.com/questions/520057/Как-выровнять-поля-html-form