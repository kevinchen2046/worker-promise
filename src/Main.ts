import { WorkerPromise } from "./WorkerPromise";

class Main {
	constructor() {
		WorkerPromise((cb: (msg: string) => void) => {
			setTimeout(() => {
				cb("this is end");
			}, 2000);
		}).then((msg) => console.log(msg))
	}
}
new Main();
