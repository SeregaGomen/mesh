import React from "react";
import {renderImage, renderParams} from '../draw/draw';
import {radToDeg} from '../utils/utils';
import {Canvas, CheckBox, Slider, LoadButton, RadioBox} from './primitives';


// https://medium.com/@jmuse/передача-данных-между-компонентами-в-react-d86394da2b50
class RotateBox extends React.Component {
    render() {
        return (
            this.props.mesh ?
                <fieldset className="rotationBox">
                    <legend>Rotation</legend>
                    <CheckBox isChecked={this.props.isAutoRotation} caption={"Auto-rotation"}
                              updateData={this.props.updateIsAutoRotation}/>
                    <Slider min={0} max={360} step={1} value={this.props.rotation[0]} caption={"X:"}
                            enabled={!this.props.isAutoRotation} updateData={
                        (value) => {
                            this.props.updateRotation([value, this.props.rotation[1], this.props.rotation[2]])
                        }
                    }/>
                    <Slider min={0} max={360} step={1} value={this.props.rotation[1]} caption={"Y:"}
                            enabled={!this.props.isAutoRotation} updateData={
                        (value) => {
                            this.props.updateRotation([this.props.rotation[0], value, this.props.rotation[2]])
                        }
                    }/>
                    <Slider min={0} max={360} step={1} value={this.props.rotation[2]} caption={"Z:"}
                            enabled={!this.props.isAutoRotation} updateData={
                        (value) => {
                            this.props.updateRotation([this.props.rotation[0], this.props.rotation[1], value])
                        }
                    }/>
                </fieldset>
            : null
        )
    }
}

class ResultBox extends React.Component {
    updateFunction = (event) => {
        this.props.updateFunIndex({funIndex: Number(event.target.value)});
    }
    updateCheckbox = (event) => {
        this.props.updateIsLegend({isLegend: event});
    }
    updateNumColors = (event) => {
        this.props.updateNumColors({numColors: Number(event)});
    }
    render() {
        return (
            this.props.mesh ?
                <fieldset className="resultBox">
                    <legend>Result</legend>
                    <label>Function:&nbsp;
                        <select
                            name="Function"
                            size={1}
                            value={this.props.funIndex}
                            //onChange={event => this.setState({funIndex: event.target.value})}>
                            onChange={this.updateFunction}>
                            {
                                this.props.mesh ? this.props.mesh.func.map((v, i) => (<option value={i}>{v.name}</option>)) : null
                            }
                        </select>
                    </label>
                    <Slider min={32} max={256} step={32} value={this.props.numColors} enabled={true} caption={"Colors:"}
                            updateData={this.updateNumColors}/>
                    <CheckBox isChecked={this.props.isLegend} caption={"Legend"} updateData={this.updateCheckbox}/>
                </fieldset>
            : null
        )
    }
}

class VisualizationBox extends React.Component {
    updateRadio = (event) => {
        if (event === "Mesh and surface") {
            this.props.updateRadio(0);
        } else if (event === "Mesh") {
            this.props.updateRadio(1);
        } else {
            this.props.updateRadio(2);
        }
    }
    render() {
        return (
            this.props.mesh ?
                <fieldset className="visualizationBox">
                    <legend>Visualization</legend>
                    <RadioBox name={"ViewOption"} value={"Mesh and surface"}
                              checked={this.props.isSurface && this.props.isMesh}
                              updateData={this.updateRadio}/>
                    <RadioBox name={"ViewOption"} value={"Mesh"} checked={!this.props.isSurface && this.props.isMesh}
                              updateData={this.updateRadio}/>
                    <RadioBox name={"ViewOption"} value={"Surface"} checked={this.props.isSurface && !this.props.isMesh}
                              updateData={this.updateRadio}/>
                    <CheckBox isChecked={this.props.isAxes} caption={"Coordinate axes"}
                              updateData={this.props.updateIsAxes}/>
                </fieldset>
            : null
        )
    }
}

class TransformationSceneBox extends React.Component {
    updateTranslateX = (event) => {
        this.props.updateTranslate([Number(event), this.props.translate[1], this.props.translate[2]])
    }
    updateTranslateY = (event) => {
        this.props.updateTranslate([this.props.translate[0], Number(event), this.props.translate[2]])
    }
    render() {
        return (
            this.props.mesh ?
                <fieldset className="transformationSceneBox">
                    <legend>Transformation scene</legend>
                    <Slider min={-1} max={1} step={0.25} value={this.props.translate[0]} enabled={true}
                            caption={"Translate X:"}
                            updateData={this.updateTranslateX}/>
                    <Slider min={-1} max={1} step={0.25} value={this.props.translate[1]} enabled={true}
                            caption={"Translate Y:"}
                            updateData={this.updateTranslateY}/>
                    <Slider min={0.5} max={5} step={0.5} value={this.props.scale} enabled={true} caption={"Scale:"}
                            updateData={this.props.updateScale}/>
                </fieldset>
            : null
        )
    }
}

class TransformationObjectBox extends React.Component {
    updateTransformationX = (event) => {
        this.props.updateTransformationIndex([Number(event.target.value), this.props.transformation.index[1],
            this.props.transformation.index[2]])
    }
    updateTransformationY = (event) => {
        this.props.updateTransformationIndex([this.props.transformation.index[0], Number(event.target.value),
            this.props.transformation.index[2]])
    }
    updateTransformationZ = (event) => {
        this.props.updateTransformationIndex([this.props.transformation.index[0], this.props.transformation.index[1],
            Number(event.target.value)])
    }
    updateTransformationRatio = (event) => {
        this.props.updateTransformationRatio(event)
    }
    render() {
        return (
            this.props.mesh ?
                <fieldset className="transformationObjectBox">
                    <legend>Transformation object</legend>
                    <label>Transformation X:&nbsp;
                        <select
                            name="Function"
                            size={1}
                            value={this.props.transformation.index[0]}
                            onChange={this.updateTransformationX}>
                            {
                                this.props.mesh ? this.props.mesh.func.map((v, i) => (
                                    <option value={i} selected={i===0}>{v.name}</option>
                                )) : null
                            }
                        </select>
                    </label>
                    <label>Transformation Y:&nbsp;
                        <select
                            name="Function"
                            value={this.props.transformation.index[1]}
                            size={1}
                            onChange={this.updateTransformationY}>
                            {
                                this.props.mesh ? this.props.mesh.func.map((v, i) => (
                                    <option value={i} selected={i===1}>{v.name}</option>)
                                ) : null
                            }
                        </select>
                    </label>
                    {
                        this.props.mesh && this.props.mesh.feType.indexOf("fe2d") === -1 ?
                            <label>Transformation Z:&nbsp;
                                <select
                                    name="Function"
                                    value={this.props.transformation.index[2]}
                                    size={1}
                                    onChange={this.updateTransformationZ}>
                                    {
                                        this.props.mesh ? this.props.mesh.func.map((v, i) => (
                                            <option value={i} selected={i === 2}>{v.name}</option>)
                                        ) : null
                                    }
                                </select>
                            </label> : null
                    }
                    <Slider min={0} max={0.5} step={0.1} value={this.props.transformation.ratio} enabled={true}
                            caption={"Ratio:"} updateData={this.updateTransformationRatio}/>
                </fieldset>
            : null
        )
    }
}


export class Forms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mesh: null,
            isLegend: true,
            isAutoRotation: true,
            isAxes: true,
            funIndex: 0,
            numColors: 32,
            rotation: [0.0, 0.0, 0.0],
            translate: [0.0, 0.0, 0.0],
            scale: 0.0,
            transformation: {
                index: [0, 1, 2],
                ratio: 0.0,
            }
        };
    }
    updateFile = (value) => {
        this.setState({mesh: value.mesh});
        this.setState({funIndex: 0});
        this.setState({isLegend: true});
        this.setState({isAutoRotation: true});
        this.setState({isAxes: true});
        this.setState({numColors: 32});
        this.setState({rotation: [0.0, 0.0, 0.0]});
        this.setState({translate: [0.0, 0.0, 0.0]});
        this.setState({scale: 1.0});
        this.setState({isMesh: true});
        this.setState({isSurface: true});
        this.setState({transformation: {index: [0, 1, 2], ratio: 0.0}});
        if (value.mesh) {
            renderParams.mesh = value.mesh;
            renderParams.funIndex = 0;
            renderParams.numColors = 32;
            renderParams.isLegend = true;
            renderParams.isAutoRotation = true;
            renderParams.isAxes = true;
            renderParams.rotation = [0.0, 0.0, 0.0];
            renderParams.translate = [0.0, 0.0, 0.0];
            renderParams.scale = 1.0;
            renderParams.isMesh = true;
            renderParams.isSurface = true;
            renderParams.transformation = {index: [0, 1, 2], ratio: 0.0};
            renderImage();
        }
    }
    updateFunIndex = (value) => {
        this.setState({funIndex: value.funIndex});
        renderParams.funIndex = value.funIndex;
        renderImage();
    }
    updateNumColors = (value) => {
        this.setState({numColors: value.numColors});
        renderParams.numColors = value.numColors;
        renderImage();
    }
    updateIsLegend = (value) => {
        this.setState({isLegend: value.isLegend});
        renderParams.isLegend = value.isLegend;
        //renderImage();
    }
    updateRotation = (value) => {
        this.setState({rotation: value});
        renderParams.rotation = value;
    }
    updateIsAutoRotation = (value) => {
        this.setState({isAutoRotation: value});
        if (value === false) {
            this.setState({rotation: [
                Math.round(radToDeg(renderParams.rotation[0])) % 360,
                Math.round(radToDeg(renderParams.rotation[1])) % 360,
                Math.round(radToDeg(renderParams.rotation[2])) % 360,
            ]});
        }
        renderParams.isAutoRotation = value;
    }
    updateIsAxes = (value) => {
        this.setState({isAxes: value});
        renderParams.isAxes = value;
    }
    updateRadio = (value) => {
        if (value === 0) {
            this.setState({isMesh: true});
            this.setState({isSurface: true});
            renderParams.isMesh = true;
            renderParams.isSurface = true;
        } else if (value === 1) {
            this.setState({isMesh: true});
            this.setState({isSurface: false});
            renderParams.isMesh = true;
            renderParams.isSurface = false;
        } else {
            this.setState({isMesh: false});
            this.setState({isSurface: true});
            renderParams.isMesh = false;
            renderParams.isSurface = true;
        }
    }
    updateScale = (value) => {
        this.setState({scale: value});
        renderParams.scale = value;
    }
    updateTranslate = (value) => {
        this.setState({translate: value});
        renderParams.translate = value;
    }
    updateTransformationIndex = (value) => {
        this.setState({transformation: {index: value, ratio: this.state.transformation.ratio}});
        renderParams.transformation.index = value;
        if (this.state.transformation.ratio) {
            renderImage();
        }
    }
    updateTransformationRatio = (value) => {
        this.setState({transformation: {index: this.state.transformation.index, ratio: value}});
        renderParams.isTransformation = value !== 0;
        renderParams.transformation.ratio = value;
        renderImage();
    }

    render() {
        return (
            <form>
                <LoadButton updateData={this.updateFile}/>
                <div className="container">
                    <Canvas id={"gl"}/>
                    <Canvas id={"text"}/>
                    <div className="parametersBox">
                        <ResultBox funIndex={this.state.funIndex} numColors={this.state.numColors}
                                   isLegend={this.state.isLegend} mesh={this.state.mesh}
                                   updateFunIndex={this.updateFunIndex} updateNumColors={this.updateNumColors}
                                   updateIsLegend={this.updateIsLegend}/>
                        <RotateBox rotation={this.state.rotation} isAutoRotation={this.state.isAutoRotation}
                                   updateRotation={this.updateRotation} updateIsAutoRotation={this.updateIsAutoRotation}
                                   mesh={this.state.mesh}/>
                        <VisualizationBox mesh={this.state.mesh} isAxes={this.state.isAxes} isMesh={this.state.isMesh}
                                          isSurface={this.state.isSurface} updateIsAxes={this.updateIsAxes}
                                          updateRadio={this.updateRadio}/>
                        <TransformationSceneBox mesh={this.state.mesh} translate={this.state.translate}
                                                scale={this.state.scale} updateScale={this.updateScale}
                                                updateTranslate={this.updateTranslate}/>
                        <TransformationObjectBox funIndex={this.state.funIndex} mesh={this.state.mesh}
                                                 transformation={this.state.transformation}
                                                 updateTransformationIndex={this.updateTransformationIndex}
                                                 updateTransformationRatio={this.updateTransformationRatio}/>
                    </div>
                </div>
            </form>
        )
    }
}
