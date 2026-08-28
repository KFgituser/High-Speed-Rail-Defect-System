import { vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const client = { get: vi.fn() };
  return { client, create: vi.fn(() => client) };
});

vi.mock('axios', () => ({ default: { create: mocks.create } }));

import { getDetections, getLines } from './index.js';

describe('API client', () => {
  beforeEach(() => {
    mocks.client.get.mockReset();
  });

  it('unwraps the response data from line requests', async () => {
    mocks.client.get.mockResolvedValue({ data: [{ id: 1, name: '京沪高铁' }] });

    await expect(getLines()).resolves.toEqual([{ id: 1, name: '京沪高铁' }]);
    expect(mocks.client.get).toHaveBeenCalledWith('/lines');
  });

  it('passes detection filters as query parameters', async () => {
    const filters = { lineId: 1, severity: 'SEVERE' };
    mocks.client.get.mockResolvedValue({ data: [] });

    await getDetections(filters);
    expect(mocks.client.get).toHaveBeenCalledWith('/detections', { params: filters });
  });
});
