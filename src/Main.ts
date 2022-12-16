import { WorkerFile, WorkerMethodPromise, WorkerClassPromise } from "./WorkerPromise";

class Main {
	constructor() {
		WorkerMethodPromise((cb: (data?) => void) => {
			setTimeout(() => {
				cb("this is end");
			}, 1000);
		}).then((msg) => console.log(msg));

		let worker = WorkerClassPromise(Worker1);

		worker.exec1(3, 6).then(v => {
			console.log(v);
		});

		worker.exec2().then(v => {
			console.log(v);
		});

		worker.destory
	}
}

class Worker1 extends WorkerFile {

	private wait(time: number) {
		return new Promise(reslove => {
			setTimeout(reslove, time)
		})
	}

	public exec1(a: number, b: number) {
		let res = a + b;
		return Promise.resolve(res);
	}

	public async exec2() {
		await this.wait(2000);
		return Promise.resolve(200);
	}
}

new Main();
