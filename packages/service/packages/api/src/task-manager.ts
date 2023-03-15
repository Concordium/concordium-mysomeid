

export interface Task {
  fnc: (context: any) => Promise<any>;
  error: string | null;
  status: string | null;
  id: string;
}

const taskManager = (() => {
  const tasks: any[] = [];

  const run = async (task: Task): Promise<any> => {
    tasks.push(task);
    return await task.fnc(task);
  };

  const runBg = (task: Task) => {
    tasks.push(task);
    task.fnc(task).then().catch(e => {
      console.error("Error running task", e);
      task.error = e?.message ?? 'Unknown error';
      task.status = 'error';
    });
  };

  const get = (id: string) => {
    return tasks.find( x => x.id === id );
  };

  const getId = () => {
    return '' + Math.round(Math.random() * 999999999999999999);
  };

  return {
    run,
    runBg,
    get,
    getId,
  };
})();
export default taskManager;