import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from './Pagination.jsx';

describe('Pagination', () => {
  it('changes page through the next button', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} totalElements={41} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /next|下一页/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not render for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} totalElements={5} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
