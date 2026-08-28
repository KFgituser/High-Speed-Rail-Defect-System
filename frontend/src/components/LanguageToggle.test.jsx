import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '../i18n/index.js';
import LanguageToggle from './LanguageToggle.jsx';

describe('LanguageToggle', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('zh');
  });

  it('changes the language and persists the selection', async () => {
    render(<LanguageToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(localStorage.getItem('lang')).toBe('en');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
  });
});
