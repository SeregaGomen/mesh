import React from "react";
import {loadFile} from "../file/file";

export class Canvas extends React.Component {
    render() {
        return (
            <canvas id={this.props.id}>
                Please use a browser that supports "canvas"
            </canvas>
        )
    }
}

export class LoadButton extends React.Component {
    updateFile = (value) => {
        this.props.updateData(value);
    }
    render() {
        return (
            <input type="file"
                   accept=".mesh, .msh, .vol, .qres, .res, .txt"
                   onChange={(event) => {
                       this.props.clear();
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
    render() {
        return (
            <label>
                <input type="radio"
                       value={this.props.value}
                       name={this.props.name}
                       checked={this.props.checked}
                       onChange={(event) => {
                           this.props.updateData(event.target.value);
                       }}
                />
                {this.props.value}
            </label>
        );
    }
}

export class CheckBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isChecked: this.props.isChecked,
        };
    }

    render() {
        return (
            <label>
                <input type="checkbox"
                       checked={this.props.isChecked}
                       onChange={() => {
                           this.setState({isChecked: !this.state.isChecked});
                           this.props.updateData(!this.state.isChecked);
                       }}
                />
                {this.props.caption}
            </label>
        );
    }
}

export class ListBox extends React.Component {
    render() {
        return (
            <label>{this.props.label}
                <select
                    name={this.props.name}
                    size={1}
                    value={this.props.value}
                    onChange={this.props.updateData}>
                    {
                        this.props.mesh ? this.props.mesh.func.map((v, i) => (
                            <option key={i} value={i} selected={i===this.props.index}>{v.name}</option>
                        )) : null
                    }
                </select>
            </label>
        );
    }
}


// https://react.dev/reference/react-dom/components/input
// https://ru.legacy.reactjs.org/tutorial/tutorial.html
// https://ru.react.js.org/docs/getting-started.html

export class Slider extends React.Component {
    render() {
        return (
            <div>
                <label>{this.props.caption}
                    <input type="range"
                           min={this.props.min}
                           max={this.props.max}
                           step={this.props.step}
                           value={this.props.value}
                           onChange={(event) => {
                               this.props.updateData(Number(event.target.value));
                           }}
                    />
                    <span style={{display: "inline", border: "1px solid gray"}}>{this.props.value}</span>
                </label>
            </div>
        );
    }
}

// Layout
// https://ru.stackoverflow.com/questions/520057/Как-выровнять-поля-html-form