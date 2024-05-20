import React from "react";
import {renderImage, renderParams} from '../draw/draw';
import {degToRad, radToDeg} from '../utils/utils';
import {Canvas, CheckBox, Slider, LoadButton, RadioBox} from './primitives';


// https://medium.com/@jmuse/передача-данных-между-компонентами-в-react-d86394da2b50
class RotateBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isAutoRotation: this.props.isAutoRotation,
            angleX: props.angleX,
            angleY: props.angleY,
            angleZ: props.angleZ,
            sliderEnabled: props.sliderEnabled,
        };
    }
    updateCheckBox = (value) => {
        this.setState({isAutoRotation: value});
        renderParams.isRotation = !renderParams.isRotation;
        if (renderParams.isRotation === false) {
            this.setState({angleX: Math.round(radToDeg(renderParams.rotationX)) % 360});
            this.setState({angleY: Math.round(radToDeg(renderParams.rotationY)) % 360});
            this.setState({angleZ: Math.round(radToDeg(renderParams.rotationZ)) % 360});
            //console.log(this.state.angleX);
        }
        this.setState({sliderEnabled: value});
    }
    updateSliderX = (value) => {
        this.setState({angleX: value});
        renderParams.rotationX = degToRad(value);
        //console.log('***', renderParams.rotationX, renderParams.rotationY, renderParams.rotationZ, '***');
    }
    updateSliderY = (value) => {
        this.setState({angleY: value});
        renderParams.rotationY = degToRad(value);
    }
    updateSliderZ = (value) => {
        this.setState({angleZ: value});
        renderParams.rotationZ = degToRad(value);
    }
    render() {
        return (
            <fieldset className="rotationBox">
                <legend>Rotation</legend>
                <CheckBox isChecked={this.state.isAutoRotation} caption={"Auto-rotation"} updateData={this.updateCheckBox}/>
                <Slider min={0} max={360} step={1} value={this.state.angleX} caption={"X:"} enabled={this.state.sliderEnabled} updateData={this.updateSliderX}/>
                <Slider min={0} max={360} step={1} value={this.state.angleY} caption={"Y:"} enabled={this.state.sliderEnabled} updateData={this.updateSliderY}/>
                <Slider min={0} max={360} step={1} value={this.state.angleZ} caption={"Z:"} enabled={this.state.sliderEnabled} updateData={this.updateSliderZ}/>
            </fieldset>
        )
    }
}

class ResultBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            funIndex: this.props.funIndex,
            isLegend: true,
            numColors: 32,
        };
    }
    updateFunction = (event) => {
        this.setState({funIndex: event.target.value});
        renderParams.funIndex = event.target.value;
        renderImage();
        this.props.updateData({funIndex: event.target.value, isLegend: this.state.isLegend});
        //alert(event.target.value);
    }
    updateCheckbox = (event) => {
        this.setState({isLegend: !event});
        this.props.updateData({funIndex: this.state.funIndex, isLegend: !event});
        renderParams.isLegend = !event;
    }
    updateNumColors = (event) => {
        this.setState({numColors: event});
        renderParams.numColors = event;
        renderImage();
    }
    render() {
        let funcList = renderParams.mesh.func.map((v, i) => (
            <option value={i}>{v.name}</option>
        ));
        return (
            <fieldset className="resultBox">
                <legend>Result</legend>
                <label>Function:&nbsp;
                    <select
                        name="Function"
                        size={1}
                        value={this.props.funIndex}
                        //onChange={event => this.setState({funIndex: event.target.value})}>
                        onChange={this.updateFunction}>
                        {funcList}
                    </select>
                </label>
                <Slider min={32} max={256} step={32} value={this.state.numColors} enabled={true} caption={"Colors:"}
                        updateData={this.updateNumColors}/>
                <CheckBox isChecked={this.state.isLegend} caption={"Legend"} updateData={this.updateCheckbox}/>


            </fieldset>
        )
    }
}

class VisualizationBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            funIndex: this.props.funIndex,
            isAxes: this.props.isAxes,
        };
    }
    updateRadio = (event) => {
        if (event === "Mesh and surface") {
            renderParams.isMesh = true;
            renderParams.isSurface = true;
        } else if (event === "Mesh") {
            renderParams.isMesh = true;
            renderParams.isSurface = false;
        } else {
            renderParams.isMesh = false;
            renderParams.isSurface = true;
        }
    }
    updateCheckbox = (event) => {
        this.setState({isAxes: !event});
        renderParams.isAxes = !renderParams.isAxes;
    }
    render() {
        return (
            <fieldset className="visualizationBox">
                <legend>Visualization</legend>
                <RadioBox name={"ViewOption"} value={"Mesh and surface"} checked={true}
                          updateData={this.updateRadio}/>
                <RadioBox name={"ViewOption"} value={"Mesh"} updateData={this.updateRadio}/>
                <RadioBox name={"ViewOption"} value={"Surface"} updateData={this.updateRadio}/>
                <CheckBox isChecked={this.state.isAxes} caption={"Coordinate axes"} updateData={this.updateCheckbox}/>

            </fieldset>
        )
    }
}

class TransformationSceneBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scale: 1.0,
            translateX: 0.0,
            translateY: 0.0,
            translateZ: 0.0,
        };
    }
    updateTranslateX = (event) => {
        this.setState({translateX: event});
        renderParams.translateX = event;
    }
    updateTranslateY = (event) => {
        this.setState({translateY: event});
        renderParams.translateY = event;
    }
    updateScale = (event) => {
        this.setState({scale: event});
        renderParams.scale = event;
    }

    render() {
        return (
            <fieldset className="transformationSceneBox">
                <legend>Transformation scene</legend>
                <Slider min={-1} max={1} step={0.25} value={this.state.translateX} enabled={true}
                        caption={"Translate X:"}
                        updateData={this.updateTranslateX}/>
                <Slider min={-1} max={1} step={0.25} value={this.state.translateY} enabled={true}
                        caption={"Translate Y:"}
                        updateData={this.updateTranslateY}/>
                <Slider min={0.5} max={5} step={0.5} value={this.state.scale} enabled={true} caption={"Scale:"}
                        updateData={this.updateScale}/>
            </fieldset>
        )
    }
}

class TransformationObjectBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            x_index: 0,
            y_index: 1,
            z_index: 2,
            ratio: 1.0E+4,
        };
    }
    render() {
        return (
            <fieldset className="transformationObjectBox">
                <legend>Transformation object</legend>
                <label>Transformation X:&nbsp;
                    <select
                        name="Function"
                        size={1}
                        onChange={(event) => this.setState({
                            x_index: event.target.value
                        })}>
                        {
                            renderParams.mesh.func.map((v, i) => (
                                <option value={i} selected={i===0}>{v.name}</option>))
                        }
                    </select>
                </label>
                <label>Transformation Y:&nbsp;
                    <select
                        name="Function"
                        size={1}
                        onChange={(event) => this.setState({
                            y_index: event.target.value
                        })}>
                        {
                            renderParams.mesh.func.map((v, i) => (
                                <option value={i} selected={i===1}>{v.name}</option>))
                        }
                    </select>
                </label>
                <label>Transformation Z:&nbsp;
                    <select
                        name="Function"
                        size={1}
                        onChange={(event) => this.setState({
                            z_index: event.target.value
                        })}>
                        {
                            renderParams.mesh.func.map((v, i) => (
                                <option value={i} selected={i===2}>{v.name}</option>))
                        }
                    </select>
                </label>
                <div>
                    <input type="number" onChange={
                        (event) => {
                            this.setState({ratio: Number(event.target.value)})
                        }
                    }/>
                </div>
                <div>
                    <button onClick={
                        () => {
                            renderParams.isTransformation = true;
                            renderParams.transformParam.index[0] = this.state.x_index;
                            renderParams.transformParam.index[1] = this.state.y_index;
                            renderParams.transformParam.index[2] = this.state.z_index;
                            renderParams.transformParam.ratio = this.state.ratio;
                            renderImage();
                        }} type={"button"}>Apply
                    </button>
                    <button onClick={
                        () => {
                            renderParams.isTransformation = false;
                            renderImage();
                        }} type={"button"}>Restore
                    </button>
                </div>
            </fieldset>
        )
    }
}


export class Forms extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isFileOpened: false,
            funIndex: null,
            isLegend: true,
        };
    }

    updateFile = (value) => {
        this.setState({isFileOpened: value.isFileOpened});
        this.setState({funIndex: value.funIndex});
    }
    updateResult = (value) => {
        this.setState({funIndex: value.funIndex});
        this.setState({isLegend: value.isLegend});
    }

    render() {
        return (
            <form>
                <LoadButton updateData={this.updateFile}/>
                <div className="container">
                    <Canvas id={"gl"}/>
                    <Canvas id={"text"}/>
                    <div className="parametersBox">
                        {
                            this.state.funIndex !== null ? <ResultBox funIndex={this.state.funIndex}
                                                                      updateData={this.updateResult}/> : null
                        }
                        {
                            this.state.isFileOpened ? <RotateBox angleX={0} angleY={0} angleZ={0} isAutoRotation={true}
                                                                 sliderEnabled={false}/> : null
                        }
                        {this.state.isFileOpened ?
                            <VisualizationBox funIndex={this.state.funIndex} isAxes={true}/> : null}
                        {this.state.isFileOpened ? <TransformationSceneBox/> : null}
                        {renderParams.funIndex !== null ? <TransformationObjectBox/> : null}
                    </div>
                </div>
            </form>
        )
    }
}
