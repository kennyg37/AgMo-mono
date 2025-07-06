import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders debug panel', () => {
    render(<App />);
    expect(screen.getByText('Debug Panel')).toBeInTheDocument();
  });

  it('renders control panel', () => {
    render(<App />);
    expect(screen.getByText('Control Panel')).toBeInTheDocument();
  });
});