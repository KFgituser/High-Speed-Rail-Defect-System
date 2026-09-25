export function openAuthorizedSse(url, { onEvent, onError } = {}) {
  const controller = new AbortController();

  const run = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication is required');

      const response = await fetch(url, {
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = 'message';
      let dataLines = [];

      const dispatch = async () => {
        if (dataLines.length) {
          await onEvent?.({ event: eventName, data: dataLines.join('\n') });
        }
        eventName = 'message';
        dataLines = [];
      };

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lineEnd;
        while ((lineEnd = buffer.indexOf('\n')) >= 0) {
          const rawLine = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 1);
          const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

          if (!line) {
            await dispatch();
          } else if (line.startsWith('event:')) {
            eventName = line.slice(6).trim() || 'message';
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
          }
        }
      }

      await dispatch();
    } catch (error) {
      if (error?.name !== 'AbortError') onError?.(error);
    }
  };

  void run();
  return { close: () => controller.abort() };
}
