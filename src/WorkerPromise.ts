///////////////////////////////////
// -------------------------------
// @author:Kevin.Chen
// @date:2022-12-15
// @email:kevin-chen@foxmail.com
// -------------------------------
///////////////////////////////////

/**
 * 线程一次执行模板
 */
class WorkerOnceTemplate {
    protected postMessage: (data) => void;
    constructor() {
        this.postMessage = (msg) => {
            (globalThis as any).postMessage(msg)
        }
        (globalThis as any).onmessage = (e) => {
            let promise = (this as any).exec((data) => {
                this.postMessage(data);
            });
            if (promise) {
                promise.then(data => {
                    this.postMessage(data);
                });
            }
        };
        //{{}}//
    }
}

/**
 * 子线程基类
 */
export class WorkerFile {
    /**线程控制器 */
    public controller: WorkerFileController;
    protected postMessage: (data: any) => void;
    protected onMessage: (msg: string) => void;
    public destory: () => void;
    constructor() {

        this.postMessage = (data) => {
            (globalThis as any).postMessage(data)
        }

        (globalThis as any).onmessage = (e) => {
            let msg = e.data.name;
            let method: Function = this[msg];
            if (!method) {
                this.onMessage(msg);
                return;
            }
            let promise = method.apply(this, e.data.args);
            if (promise) {
                promise.then(data => {
                    // console.log(data);
                    this.postMessage({ name: msg, data: data });
                });
            } else {
                this.postMessage({ name: msg, data: promise });
            }
        }
    }
    //{{method}}//
}

/**
 * 线程控制器
 */
export class WorkerFileController {
    //线程句柄
    private _worker: Worker;
    private _callbacks:{[name:string]:(data:any,name?:string)=>void}
    constructor(worker: Worker) {
        this._worker = worker;
        this._callbacks = {};
        worker.onmessage = (e) => {
            let name = e.data.name;
            let data = e.data.data;
            if (this._callbacks[name]) {
                this._callbacks[name](data,name);
            }
        }
    }

    public sendMessage(name: string, ...args) {
        this._worker.postMessage({ name: name, args: args })
    }

    public onMessage(name: string,callback:(data:any,name?:string)=>void) {
        this._callbacks[name]=callback;
    }

    public destory(){
        this._callbacks=null;
        if(!this._worker) return;
        this._worker.onmessage=null;
        this._worker.terminate();
        this._worker=null;
    }
}

///////////
function getTemplateString(clazz, method?) {
    let str = clazz.toString();
    let name = str.toString().match(/(?<=class)(.*?)(?={)/)[0].replace(/ /g, "");
    if (method) str = str.replace(`//{{}}//`, `this.exec=${method.toString()}`)
    return `${str};\nnew ${name}();`
}
///////////
/**
 * 对方法进行线程包装
 * - 需要注意的是该包装器会在执行完成之后自动销毁线程
 * @param method 需要放在多线程执行的方法
 * @returns 
 */
export function WorkerMethodPromise(method: (data?) => void) {
    return new Promise<void>(reslove => {
        let workerContent = getTemplateString(WorkerOnceTemplate, method);
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


function getWorkerFileString(clazz) {
    let str = clazz.toString();
    let proto = clazz.__proto__.toString();
    proto = proto.replace(`class WorkerFile {`, "");
    let constructor = proto.substring(0, proto.lastIndexOf("}") - 1);
    //extends WorkerPromise_1.WorkerFile {
    str = str.replace(str.match(/(extends)(.*?)({)/)[0], `{${constructor}`);
    let name = str.toString().match(/(?<=class)(.*?)(?={)/)[0].replace(/ /g, "");
    //适配webpack 如果使用其他web编译器 这里可能需要改动
    let adapter = `function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }`;
    str = str.replace(new RegExp(str.match(/(tslib)(.*?)(__awaiter)/)[0], "g"), `__awaiter`);
    return `${adapter}\n${str};\nnew ${name}();`
}

/**
 * 对WorkerFile的子类进行线程包装
 * - 需要注意的是所有的方法成员都应该是异步的,返回成员都应该是Promise
 * @param clazz WorkerFile的子类引用
 * @returns 
 */
export function WorkerClassPromise<T extends WorkerFile>(clazz: { new(): T }): T {

    let props = Object.getOwnPropertyNames(clazz.prototype);
    let methods = props.filter(v => {
        if (v == "constructor") return false;
        let desc = Object.getOwnPropertyDescriptor(clazz.prototype, v);
        return desc.value instanceof Function;
    });
    //console.log(getWorkerFileString(clazz));
    let workerContent = getWorkerFileString(clazz);
    // console.log(workerContent);
    let blob = new Blob([workerContent], { type: "text/javascript" })
    // Note: window.webkitURL.createObjectURL() in Chrome 10+.
    let worker = new Worker(window.URL.createObjectURL(blob));
    //worker.postMessage("hello"); // Start the worker.
    let controller = new WorkerFileController(worker)
    let proxy = {
        controller: controller,
        destory() {
            controller.destory();
        }
    };
    methods.forEach(name => {
        proxy[name] = (...args) => {
            worker.postMessage({ name: name, args: args });
            return new Promise(reslove => {
                controller.onMessage(name,reslove);
            });
        }
    })
    return proxy as any as T;
}