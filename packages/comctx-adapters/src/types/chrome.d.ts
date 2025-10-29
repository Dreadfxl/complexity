declare namespace chrome {
  namespace runtime {
    interface MessageSender {
      tab?: { id?: number };
      frameId?: number;
    }
    const onMessage: any;
    function sendMessage(...args: any[]): void;
  }
  namespace tabs {
    function sendMessage(...args: any[]): void;
  }
}
