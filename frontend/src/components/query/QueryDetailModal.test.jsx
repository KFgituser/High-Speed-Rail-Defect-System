import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QueryDetailModal from './QueryDetailModal.jsx';

it('offers a working detail export and no fake photo previews', () => {
  const onExport = vi.fn();
  const { container } = render(
    <QueryDetailModal
      modalRef={React.createRef()}
      detail={{ id: 'D-1', line: '京沪高铁', history: [] }}
      displayLine={(value) => value}
      displayType={(value) => value}
      displayDescription={(value) => value}
      getSeverityClass={() => ''}
      getSeverityLabel={(value) => value}
      onExport={onExport}
    />
  );

  fireEvent.click(screen.getByText(/导出详情|Export details/));
  expect(onExport).toHaveBeenCalledOnce();
  expect(container.querySelectorAll('.photo-placeholder')).toHaveLength(0);
  expect(screen.getByText(/暂无关联的现场照片|No site photos/)).toBeInTheDocument();
});
