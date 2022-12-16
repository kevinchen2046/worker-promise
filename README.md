# WorkerPromise

> `web Worker` 需要隔离代码？多线程代码更难维护？
通过`WorkerPromise`你无需隔离编写代码!
就像在同一个上下文中编写普通方法和类一样简单。

## 包装Worker方法

- 通过`WorkerMethodPromise`包装器你可以轻松将方法转为子线程执行

```typescript Main.ts
//定义线程函数
//cb为执行结束回调
function worker1(cb: (msg?: string) => void){
    setTimeout(() => {
		cb("this is worker end!");
	}, 2000);
}

//执行线程
WorkerMethodPromise(worker1).then((msg) => console.log(msg));
```

## 包装Worker类
- 通过`WorkerClassPromise`包装器你可以轻松将类转为子线程执行

``` typescript
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

let worker = WorkerClassPromise(Worker1);

worker.exec1(3, 6).then(v => {
	console.log(v);
});

worker.exec2().then(v => {
	console.log(v);
});

```
