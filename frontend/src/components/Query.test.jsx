import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Query from './Query.jsx';

const api = vi.hoisted(() => ({
  getDetections: vi.fn(), getLedgers: vi.fn(), downloadExport: vi.fn()
}));

vi.mock('../api/index.js', () => ({
  getLines: () => Promise.resolve([{ name: '测试线路', kmMin: 0, kmMax: 1300 }]),
  getDiseaseTypes: () => Promise.resolve(['裂纹', '破损', '沉降']),
  getDetections: api.getDetections,
  getLedgers: api.getLedgers,
  getDetail: vi.fn()
}));
vi.mock('../api/export.js', () => ({ downloadExport: api.downloadExport, downloadDetail: vi.fn() }));
vi.mock('./AppLayout.jsx', () => ({ default: ({ children }) => <div>{children}</div> }));

it('passes all selected types and numeric mileage bounds to both paged queries', async () => {
  api.getDetections.mockResolvedValue({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  api.getLedgers.mockResolvedValue({ content: [], page: 0, totalElements: 0, totalPages: 0 });
  const { container } = render(<MemoryRouter><Query /></MemoryRouter>);
  await waitFor(() => expect(api.getDetections).toHaveBeenCalledOnce());

  fireEvent.change(container.querySelector('#lineSelect'), { target: { value: '测试线路' } });
  fireEvent.click(screen.getByLabelText(/裂纹|Crack/));
  fireEvent.click(screen.getByLabelText(/破损|Damage/));
  const slider = container.querySelector('.slider-wrapper');
  slider.getBoundingClientRect = () => ({ left: 0, width: 100 });
  fireEvent.mouseDown(slider, { clientX: 0 });
  fireEvent.mouseMove(document, { clientX: 50 });
  fireEvent.mouseUp(document);

  fireEvent.click(screen.getByRole('button', { name: /查询|Search/ }));
  await waitFor(() => expect(api.getDetections).toHaveBeenCalledTimes(2));
  expect(api.getDetections.mock.lastCall[0]).toMatchObject({
    line: '测试线路', types: '裂纹,破损', minMileage: 650000, maxMileage: 1300000
  });
  expect(api.getLedgers.mock.lastCall[0]).toMatchObject({
    line: '测试线路', types: '裂纹,破损', minMileage: 650000, maxMileage: 1300000
  });
});
