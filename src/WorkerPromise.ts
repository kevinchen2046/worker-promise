///////////////////////////////////
// -------------------------------
// @author:Kevin.Chen
// @date:2022-12-15
// @email:kevin-chen@foxmail.com
// -------------------------------
///////////////////////////////////

///////////
class WorkerFile {
    constructor() {
        (globalThis as any).onmessage = this.onmessage.bind(this);
        (this as any).postMessage = (msg) => {
            (globalThis as any).postMessage(msg)
        }
        //{{}}//
    }
    onmessage(e) {
        (this as any).exec((data) => {
            (this as any).postMessage(data.toString());
        });
    }
}
///////////
function getWorkerString(clazz, method) {
    let str = clazz.toString();
    let name = str.toString().match(/(?<=class)(.*?)(?={)/)[0].replace(/ /g, "");
    str = str.replace(`//{{}}//`, `this.exec=${method.toString()}`)
    return `${str};\nnew ${name}();`
}
///////////
export function WorkerPromise(method) {
    return new Promise<void>(reslove => {
        let workerContent = getWorkerString(WorkerFile, method);
        // console.log(workerContent);
        let blob = new Blob([workerContent], { type: "text/javascript" })
        // Note: window.webkitURL.createObjectURL() in Chrome 10+.
        let worker = new Worker(window.URL.createObjectURL(blob));
        worker.onmessage = function (e) {
            worker.terminate();
            reslove(e.data);
        }
        worker.postMessage("hello"); // Start the worker.
    });
}
