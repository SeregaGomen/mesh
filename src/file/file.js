// Load *.mesh file (internal format)
import {renderParams} from "../draw/draw";

export function loadMesh(fileData, mesh) {
    // Get FE type
    switch (getRow(fileData).row) {
        case "fe2d3":
        case "3":
            mesh.feType = "fe2d3";
            break;
        case "fe2d4":
        case "24":
            mesh.feType = "fe2d4";
            break;
        case "fe3d4":
        case "4":
            mesh.feType = "fe3d4";
            break;
        case "fe3d8":
        case "8":
            mesh.feType = "fe3d8";
            break;
        case "fe3d3s":
        case "223":
            mesh.feType = "fe3d3s";
            break;
        case "fe3d4s":
        case "224":
            mesh.feType = "fe3d4s";
            break;
        default:
            console.log("Wrong mesh format!");
            //alert("Wrong mesh format!");
            return false;
    }
    let numVertex = Number(getRow(fileData).row);
    // Get vertex coordinates
    for (let i = 0; i < numVertex; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let x = [];
        for (let j = 0; j < words.length; j++) {
            if (words[j] !== "") {
                x.push(Number(words[j]));
            }
        }
        mesh.x.push(x);
    }
    // Get FE number
    let numFE = Number(getRow(fileData).row);
    // Get FE indexes
    for (let i = 0; i < numFE; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let fe = [];
        for (let j = 0; j < words.length; j++) {
            if (words[j] !== "") {
                fe.push(Number(words[j]));
            }
        }
        mesh.fe.push(fe);
    }
    // Get BE number
    let numBE = Number(getRow(fileData).row);
    // Get BE indexes
    for (let i = 0; i < numBE; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let be = [];
        for (let j = 0; j < words.length; j++) {
            if (words[j] !== "") {
                be.push(Number(words[j]));
            }
        }
        mesh.be.push(be);
    }
    if (mesh.feType === "fe3d3s" || mesh.feType === "fe3d4s") {
        mesh.be = mesh.fe;
    }
    return true
}

function getRow(file) {
    let eof = false;
    let offset = 2;
    let index = file.data.indexOf("\r\n");
    if (index === -1) {
        index = file.data.indexOf("\n");
        offset = 1;
    }
    let ret;
    if (index !== -1) {
        ret = file.data.slice(0, index);
        file.data = file.data.slice(index + offset, file.data.length);
        if (file.data.length === 0) {
            eof = true;
        }
    } else {
        ret = file.data.slice(0, file.data.length);
        eof = true;
    }
    return {row: ret, eof: eof};
}

// Load *.vol file (NetGen)
export function loadVol(fileData, mesh) {
    // Get boundary elements
    let data = getRow(fileData);
    while (!data.eof) {
        if (data.row === "surfaceelements") {
            break;
        }
        data = getRow(fileData);
    }
    if (data.eof) {
        console.log("Wrong VOL-file format");
        return false;
    }

    mesh.feType = "fe3d4";
    // Get BE number
    let num = Number(getRow(fileData).row);
    // Get BE indexes
    for (let i = 0; i < num; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let be = [];
        for (let j = 0; j < 3; j++) {
            if (words[j] !== "") {
                be.push(Number(words[j + 5]) - 1);
            }
        }
        mesh.be.push(be);
    }

    // Get finite elements
    data = getRow(fileData);
    while (!data.eof) {
        if (data.row === "volumeelements") {
            break;
        }
        data = getRow(fileData);
    }
    if (data.eof) {
        console.log("Wrong VOL-file format");
        return false;
    }

    // Get FE number
    num = Number(getRow(fileData).row);
    // Get FE indexes
    for (let i = 0; i < num; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let fe = [];
        for (let j = 0; j < 4; j++) {
            if (words[j] !== "") {
                fe.push(Number(words[j]) - 1);
            }
        }
        mesh.fe.push(fe);
    }

    // Get vertex coordinates
    data = getRow(fileData);
    while (!data.eof) {
        if (data.row === "points") {
            break;
        }
        data = getRow(fileData);
    }
    if (data.eof) {
        console.log("Wrong VOL-file format");
        return false;
    }

    // Get vertex number
    num = Number(getRow(fileData).row);
    // Get vertexes
    for (let i = 0; i < num; i++) {
        let words = getRow(fileData).row.trim().split(' ');
        let x = [];
        for (let j = 0; j < words.length; j++) {
            if (words[j] !== "") {
                x.push(Number(words[j]));
            }
        }
        mesh.x.push(x);
    }
    return true;
}

// Load *.msh file (GMSH)
export function loadMsh(fileData, mesh) {
    // Get boundary elements
    let data = getRow(fileData);

    if (data.row !== "$MeshFormat") {
        console.log("Wrong MSH-file format");
        return false;
    }
    data = getRow(fileData);
    while (!data.eof) {
        if (data.row === "$Nodes") {
            break;
        }
        data = getRow(fileData);
    }
    if (data.eof) {
        console.log("Wrong MSH-file format");
        return false;
    }
    let words = getRow(fileData).row.trim().split(' ');
    let numEntities = Number(words[0]);
    let is2d = true;
    for (let i = 0; i < numEntities; i++) {
        words = getRow(fileData).row.trim().split(' ');
        let num = Number(words[3]);
        // Ignoring tags
        for (let j = 0; j < num; j++) {
            data = getRow(fileData);
        }
        for (let j = 0; j < num; j++) {
            let x = [];
            words = getRow(fileData).row.trim().split(' ');
            for (let k = 0; k < 3; k++) {
                x.push(Number(words[k]));
            }
            if (Math.abs(x[2]) > 1.0e-10) {
                is2d = false;
            }    
            mesh.x.push(x);
        }
    }
    if (getRow(fileData).row !== "$EndNodes") {
        console.log("Wrong MSH-file format");
        return false;
    }
    if (getRow(fileData).row !== "$Elements") {
        console.log("Wrong MSH-file format");
        return false;
    }
    // Number of section
    words = getRow(fileData).row.trim().split(' ');
    numEntities = Number(words[0]);
    let minTag = Number(words[2]);
    for (let i = 0; i < numEntities; i++) {
        words = getRow(fileData).row.trim().split(' ');
        let dim = Number(words[0]);
        let elmType = Number(words[2]);
        let num = Number(words[3]);
        for (let j = 0; j < num; j++) {
            data = getRow(fileData);
            if (dim === 0 || (dim === 1 && is2d === false)) {
                continue;
            }
            words = data.row.trim().split(' ');
            // Reading current element
            let elm = [];
            for (let k = 1; k < words.length; k++) {
                elm.push(Number(words[k]) - minTag);
            }
            switch (elmType) {
                case 1: // 2-node line
                    if (is2d) {
                        // Boundary element
                        mesh.be.push(elm);
                    }
                    break;
                case 2: // 3-node triangle
                    if (is2d) {
                        // Finite element
                        mesh.fe.push(elm);
                    } else {
                        // Boundary element
                        mesh.be.push(elm);
                    }
                    break;
                case 4: // 4-node tetrahedron
                    if (!is2d) {
                        // Finite element
                        mesh.fe.push(elm);
                    } else {
                        console.log("This format of MSH-file is not supported");
                        return false;
                    }
                    break;
                default:
                    console.log("This format of MSH-file is not supported");
                    return false;
            }
        }
    }
    if (getRow(fileData).row !== "$EndElements") {
        console.log("Wrong MSH-file format");
        return false;
    }
    if (is2d) {
        mesh.feType = "fe2d3";
    } else {
        mesh.feType = "fe3d4";
        if (mesh.be.length === 0) {
            mesh.be = mesh.fe;
            mesh.feType = "fe3d3s";
        }
    }
    return true;
}

export function loadQres(fileData, mesh) {
    // Get signature
    if (getRow(fileData).row !== "QFEM results file") {
        console.log("Wrong QRES-file format");
        return false;
    }
    // Get mesh
    if (!loadMesh(fileData, mesh)) {
        return false;
    }
    getRow(fileData);
    return loadResults(fileData, mesh);
}

function loadResults(fileData, mesh) {
    let numFun = Number(getRow(fileData).row);
    for (let i = 0; i < numFun; i++) {
        let name = getRow(fileData).row;
        getRow(fileData);
        let num = Number(getRow(fileData).row);
        let data = [];
        for (let j = 0; j < num; j++) {
            let val = Number(getRow(fileData).row);
            data.push(val);
        }
        let minMax = getMinMax(data);
        mesh.func.push({name: name, results: data, minU: minMax.minU, maxU: minMax.maxU});
    }
    return true;
}

// Calc min and max value of function
function getMinMax(data) {
    let minU = data[0];
    let maxU = data[0];
    for (let i = 1; i < data.length; i++) {
        if (data[i] < minU) {
            minU = data[i];
        }
        if (data[i] > maxU) {
            maxU = data[i];
        }
    }
    return {minU: minU, maxU: maxU};
}

export function loadFile(file) {
    return new Promise(function(resolve, reject) {
        let fileExt = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length);
        let reader = new FileReader();
        reader.readAsText(file);

        // Mesh & results data structure
        let mesh = {
            feType: "", // Type of mesh
            x: [],      // Vertex coordinates
            fe: [],     // Finite element
            be: [],     // Boundary elements
            func: [],   // Results data
        };
        reader.onload = function () {
            let ok = false;
            let fileData = {
                data: reader.result
            };
            renderParams.funIndex = null;
            switch (fileExt.toUpperCase()) {
                case "MESH":
                    ok = loadMesh(fileData, mesh);
                    break;
                case "VOL":
                    ok = loadVol(fileData, mesh);
                    break;
                case "MSH":
                    ok = loadMsh(fileData, mesh);
                    break;
                case "QRES":
                    ok = loadQres(fileData, mesh);
                    renderParams.funIndex = 0;
                    break;
                default:
                    alert("Unknown file format!");
                    reject({isFileOpened: false, funIndex: null});
                    return;
            }

            // const canvas = document.querySelector("canvas");
            // const context = canvas.getContext('2d');
            // context.clearRect(0, 0, canvas.width, canvas.height);

            if (ok) {
                renderParams.mesh = mesh;
                resolve({isFileOpened: true, funIndex: renderParams.funIndex});
            } else {
                alert("Unable to read file!");
                reject({isFileOpened: false, funIndex: null});
            }
        };
        reader.onerror = function () {
            alert(reader.error);
            //console.log(reader.error);
            reject({isFileOpened: false, funIndex: null});
        };
    });
}