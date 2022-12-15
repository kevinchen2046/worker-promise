# WorkerPromise
多线程Promise

Web Worker 需要在单独的js文件实现？
通过`WorkerPromise`你无需分开文件书写代码!

## 例子
你完全可以将多线程代码和单线程代码混合书写
```typescript Main.ts
//定义线程函数
//cb为执行结束回调
function worker1(cb: (msg?: string) => void){
    setTimeout(() => {
		cb("this is worker end!");
	}, 2000);
}

//执行线程
WorkerPromise(worker1).then((msg) => console.log(msg));
```