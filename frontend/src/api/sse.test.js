import { waitFor } from '@testing-library/react';
import { openAuthorizedSse } from './sse.js';

describe('openAuthorizedSse', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends the JWT in the stream request and parses an event', async () => {
    localStorage.setItem('token', 'stream-token');
    const onEvent = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: done\ndata: DONE\n\n'));
        controller.close();
      }
    });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, body });

    openAuthorizedSse('/api/viz/stream', { onEvent });

    await waitFor(() => expect(onEvent).toHaveBeenCalledWith({ event: 'done', data: 'DONE' }));
    expect(fetch).toHaveBeenCalledWith('/api/viz/stream', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer stream-token' })
    }));
  });

  it('reports an authentication error without calling the network when token is missing', async () => {
    const onError = vi.fn();

    openAuthorizedSse('/api/viz/stream', { onError });

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(fetch).not.toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toMatchObject({ message: 'Authentication is required' });
  });

  it('reports a failed HTTP response', async () => {
    localStorage.setItem('token', 'stream-token');
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const onError = vi.fn();

    openAuthorizedSse('/api/viz/stream', { onError });

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0][0]).toMatchObject({ message: 'SSE request failed with status 503' });
  });
});
